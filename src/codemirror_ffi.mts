import {
  linter,
  Diagnostic,
  setDiagnostics,
  lintGutter,
} from "@codemirror/lint";
import { indentWithTab } from "@codemirror/commands";
import { Text } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";

export class CodeMirror extends HTMLElement {
  editor: EditorView;

  get value() {
    return this.editor.state.doc.toString() || "";
  }

  set value(newValue: string) {
    this._setContent(newValue);
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
        basicSetup,
        keymap.of([indentWithTab]),
        linter(null, {
          autoPanel: true,
        }),
        lintGutter(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const event = new CustomEvent("lines-changed", {
              detail: update.state.doc.toJSON(),
            });
            this.dispatchEvent(event);
          }
        }),
      ],
    });
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
