import { indentWithTab } from "@codemirror/commands";
import { Diagnostic, linter, setDiagnostics } from "@codemirror/lint";
import {
  Extension,
  RangeSet,
  StateEffect,
  StateField,
  Text,
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  GutterMarker,
  gutter,
  keymap,
} from "@codemirror/view";
import { basicSetup } from "codemirror";

// === Breakpoints ===

interface Breakpoint {
  pos: number;
  on: boolean;
}

const breakpointEffect = StateEffect.define<Breakpoint>({
  map: (val, mapping) => ({ pos: mapping.mapPos(val.pos), on: val.on }),
});

const breakpointState = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty;
  },
  update(rangeSet, transaction) {
    rangeSet = rangeSet.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(breakpointEffect)) {
        if (effect.value.on)
          rangeSet = rangeSet.update({
            add: [breakpointMarker.range(effect.value.pos)],
          });
        else
          rangeSet = rangeSet.update({
            filter: (from) => from != effect.value.pos,
          });
      }
    }
    return rangeSet;
  },
});

function toggleBreakpoint(view: EditorView, pos: number) {
  let breakpoints = view.state.field(breakpointState);
  let hasBreakpoint = false;
  breakpoints.between(pos, pos, () => {
    hasBreakpoint = true;
  });
  view.dispatch({
    effects: breakpointEffect.of({ pos, on: !hasBreakpoint }),
  });
}

const breakpointMarker = new (class extends GutterMarker {
  toDOM() {
    return document.createTextNode("⬤");
  }
})();

const breakpointGutter = [
  breakpointState,
  gutter({
    class: "cm-breakpoint-gutter",
    markers: (v) => v.state.field(breakpointState),
    initialSpacer: () => breakpointMarker,
    domEventHandlers: {
      mousedown(view, line) {
        toggleBreakpoint(view, line.from);
        return true;
      },
    },
  }),
  EditorView.baseTheme({
    ".cm-breakpoint-gutter .cm-gutterElement": {
      color: "red",
      paddingLeft: "5px",
      cursor: "default",
      fontSize: "0.8rem",
    },
  }),
];

function getBreakpointLines(
  doc: Text,
  breakpoints: RangeSet<GutterMarker>
): number[] {
  const result: number[] = [];
  for (let iter = breakpoints.iter(); iter.value !== null; iter.next()) {
    const line_no = doc.lineAt(iter.from).number;
    result.push(line_no);
  }
  return result;
}

// === Active Program Line ===

const activeProgramLineDecos = ["h0", "h1", "h2", "h3"].map((history) =>
  Decoration.line({
    attributes: { class: `cm-activeProgramLine ${history}` },
  })
);

const setActiveProgramLine = StateEffect.define<number[] | undefined>();

const activeProgramLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, transaction) {
    deco = deco.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(setActiveProgramLine)) {
        if (effect.value === undefined) {
          deco = Decoration.none;
        } else {
          const decos = effect.value.map((line_no, idx) => {
            const line = transaction.state.doc.line(line_no);
            return activeProgramLineDecos[idx].range(line.from);
          });
          deco = Decoration.set(decos, true);
        }
      }
    }
    return deco;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const activeLineColors = {
  ".cm-activeProgramLine.h0": { backgroundColor: "#ffff00d0" },
  ".cm-activeProgramLine.h1": { backgroundColor: "#ffff0040" },
  ".cm-activeProgramLine.h2": { backgroundColor: "#ffff0028" },
  ".cm-activeProgramLine.h3": { backgroundColor: "#ffff0010" },
};
const activeLineLightTheme = Object.fromEntries(
  Object.entries(activeLineColors).map(([key, value]) => [
    `&light ${key}`,
    value,
  ])
);
const activeLineDarkTheme = Object.fromEntries(
  Object.entries(activeLineColors).map(([key, value]) => [
    `&dark ${key}`,
    value,
  ])
);
const activeProgramLineTheme = EditorView.baseTheme({
  ...activeLineLightTheme,
  ...activeLineDarkTheme,
});

const activeProgramLine: Extension = [
  activeProgramLineField,
  activeProgramLineTheme,
];

// === CodeMirror ===

export class CodeMirror extends HTMLElement {
  editor: EditorView;

  get value() {
    return this.editor.state.doc.toString() || "";
  }

  set value(newValue: string) {
    this._setContent(newValue);
  }

  set activeProgramLines(line_nos: number[] | undefined) {
    this.editor.dispatch({
      effects: setActiveProgramLine.of(line_nos),
    });
  }

  set diagnostics(diagnostics: Diagnostic[]) {
    this.editor.dispatch(setDiagnostics(this.editor.state, diagnostics));
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const template = document.createElement("div");
    template.id = "editor";
    this.shadowRoot!.appendChild(template);

    const attributes: { [key: string]: any } = {};

    for (let i = 0; i < this.attributes.length; i++) {
      if (this.attributes[i].nodeValue) {
        attributes[this.attributes[i].nodeName] = this.attributes[i].nodeValue;
      }
    }

    this.editor = new EditorView({
      ...attributes,
      parent: this.shadowRoot!.getElementById("editor") as HTMLElement,
      doc: Text.empty,
      extensions: [
        breakpointGutter,
        basicSetup,
        keymap.of([indentWithTab]),
        linter(null, {
          autoPanel: true,
        }),
        // lintGutter(),
        activeProgramLine,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const event = new CustomEvent("lines-changed", {
              detail: update.state.doc.toJSON(),
            });
            this.dispatchEvent(event);
          }
          if (update.selectionSet) {
            const head = update.state.selection.main.head;
            const line_no = update.state.doc.lineAt(head).number;
            this.dispatchEvent(
              new CustomEvent("selected-line-changed", { detail: line_no })
            );
          }
          const beforeBps = update.startState.field(breakpointState);
          const afterBps = update.state.field(breakpointState);
          if (!RangeSet.eq([beforeBps], [afterBps])) {
            const lines = getBreakpointLines(update.state.doc, afterBps);
            this.dispatchEvent(
              new CustomEvent("breakpoints-changed", { detail: lines })
            );
          }
        }),
      ],
    });
  }

  disconnectedCallback() {
    this.editor.destroy();
    this.shadowRoot!.getElementById("editor")?.remove();
  }

  private _setContent(value: string) {
    if (this.value !== value) {
      this.editor.dispatch({
        changes: {
          from: 0,
          to: this.editor.state.doc.length,
          insert: value,
        },
      });
    }
  }
}

export function install() {
  customElements.define("code-mirror", CodeMirror);
}
