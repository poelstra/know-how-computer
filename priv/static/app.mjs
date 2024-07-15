// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  countLength() {
    let length3 = 0;
    for (let _ of this)
      length3++;
    return length3;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values = [x, y];
  while (values.length) {
    let a = values.pop();
    let b = values.pop();
    if (a === b)
      continue;
    if (!isObject(a) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a);
    for (let k of keys2(a)) {
      values.push(get2(a, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c))
    return false;
  return a.constructor === b.constructor;
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function new$() {
  return new_map();
}
function get(from2, get2) {
  return map_get(from2, get2);
}
function do_has_key(key, dict) {
  return !isEqual(get(dict, key), new Error(void 0));
}
function has_key(dict, key) {
  return do_has_key(key, dict);
}
function insert(dict, key, value) {
  return map_insert(key, value, dict);
}
function fold_list_of_pair(loop$list, loop$initial) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    if (list.hasLength(0)) {
      return initial;
    } else {
      let x = list.head;
      let rest = list.tail;
      loop$list = rest;
      loop$initial = insert(initial, x[0], x[1]);
    }
  }
}
function from_list(list) {
  return fold_list_of_pair(list, new$());
}

// build/dev/javascript/gleam_stdlib/gleam/pair.mjs
function second(pair) {
  let a = pair[1];
  return a;
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function do_reverse(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest$1 = remaining.tail;
      loop$remaining = rest$1;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function reverse(xs) {
  return do_reverse(xs, toList([]));
}
function do_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list.head;
      let xs = list.tail;
      loop$list = xs;
      loop$fun = fun;
      loop$acc = prepend(fun(x), acc);
    }
  }
}
function map(list, fun) {
  return do_map(list, fun, toList([]));
}
function do_index_map(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let index2 = loop$index;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list.head;
      let xs = list.tail;
      let acc$1 = prepend(fun(x, index2), acc);
      loop$list = xs;
      loop$fun = fun;
      loop$index = index2 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list, fun) {
  return do_index_map(list, fun, 0, toList([]));
}
function do_try_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return new Ok(reverse(acc));
    } else {
      let x = list.head;
      let xs = list.tail;
      let $ = fun(x);
      if ($.isOk()) {
        let y = $[0];
        loop$list = xs;
        loop$fun = fun;
        loop$acc = prepend(y, acc);
      } else {
        let error = $[0];
        return new Error(error);
      }
    }
  }
}
function try_map(list, fun) {
  return do_try_map(list, fun, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list.hasLength(0)) {
      return initial;
    } else {
      let x = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, x);
      loop$fun = fun;
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list = loop$list;
    let compare3 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list.hasLength(0)) {
      if (direction instanceof Ascending) {
        return prepend(do_reverse(growing$1, toList([])), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list.head;
      let rest$1 = list.tail;
      let $ = compare3(prev, new$1);
      if ($ instanceof Gt && direction instanceof Descending) {
        loop$list = rest$1;
        loop$compare = compare3;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Lt && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare3;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Eq && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare3;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Gt && direction instanceof Ascending) {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(do_reverse(growing$1, toList([])), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare3(new$1, next2);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare3;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Lt && direction instanceof Descending) {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(do_reverse(growing$1, toList([])), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare3(new$1, next2);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare3;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(do_reverse(growing$1, toList([])), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare3(new$1, next2);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare3;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare3 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list = list2;
      return do_reverse(list, acc);
    } else if (list2.hasLength(0)) {
      let list = list1;
      return do_reverse(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare3(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare3;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare3;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare3;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare3 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return do_reverse(acc, toList([]));
    } else if (sequences2.hasLength(1)) {
      let sequence2 = sequences2.head;
      return do_reverse(
        prepend(do_reverse(sequence2, toList([])), acc),
        toList([])
      );
    } else {
      let ascending1 = sequences2.head;
      let ascending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let descending = merge_ascendings(
        ascending1,
        ascending2,
        compare3,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare3;
      loop$acc = prepend(descending, acc);
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare3 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list = list2;
      return do_reverse(list, acc);
    } else if (list2.hasLength(0)) {
      let list = list1;
      return do_reverse(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare3(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare3;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare3;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare3;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare3 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return do_reverse(acc, toList([]));
    } else if (sequences2.hasLength(1)) {
      let sequence2 = sequences2.head;
      return do_reverse(
        prepend(do_reverse(sequence2, toList([])), acc),
        toList([])
      );
    } else {
      let descending1 = sequences2.head;
      let descending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let ascending = merge_descendings(
        descending1,
        descending2,
        compare3,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare3;
      loop$acc = prepend(ascending, acc);
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare3 = loop$compare;
    if (sequences2.hasLength(0)) {
      return toList([]);
    } else if (sequences2.hasLength(1) && direction instanceof Ascending) {
      let sequence2 = sequences2.head;
      return sequence2;
    } else if (sequences2.hasLength(1) && direction instanceof Descending) {
      let sequence2 = sequences2.head;
      return do_reverse(sequence2, toList([]));
    } else if (direction instanceof Ascending) {
      let sequences$1 = merge_ascending_pairs(sequences2, compare3, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Descending();
      loop$compare = compare3;
    } else {
      let sequences$1 = merge_descending_pairs(sequences2, compare3, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Ascending();
      loop$compare = compare3;
    }
  }
}
function sort(list, compare3) {
  if (list.hasLength(0)) {
    return toList([]);
  } else if (list.hasLength(1)) {
    let x = list.head;
    return toList([x]);
  } else {
    let x = list.head;
    let y = list.tail.head;
    let rest$1 = list.tail.tail;
    let direction = (() => {
      let $ = compare3(x, y);
      if ($ instanceof Lt) {
        return new Ascending();
      } else if ($ instanceof Eq) {
        return new Ascending();
      } else {
        return new Descending();
      }
    })();
    let sequences$1 = sequences(
      rest$1,
      compare3,
      toList([x]),
      direction,
      y,
      toList([])
    );
    return merge_all(sequences$1, new Ascending(), compare3);
  }
}
function tail_recursive_range(loop$start, loop$stop, loop$acc) {
  while (true) {
    let start4 = loop$start;
    let stop = loop$stop;
    let acc = loop$acc;
    let $ = compare2(start4, stop);
    if ($ instanceof Eq) {
      return prepend(stop, acc);
    } else if ($ instanceof Gt) {
      loop$start = start4;
      loop$stop = stop + 1;
      loop$acc = prepend(stop, acc);
    } else {
      loop$start = start4;
      loop$stop = stop - 1;
      loop$acc = prepend(stop, acc);
    }
  }
}
function range(start4, stop) {
  return tail_recursive_range(start4, stop, toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map2(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function unwrap(result, default$) {
  if (result.isOk()) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}
function all(results) {
  return try_map(results, (x) => {
    return x;
  });
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function lowercase2(string3) {
  return lowercase(string3);
}
function split_once2(x, substring) {
  return split_once(x, substring);
}
function trim2(string3) {
  return trim(string3);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
function from(a) {
  return identity(a);
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root2, shift, hash, key, val, addedLeaf) {
  switch (root2.type) {
    case ARRAY_NODE:
      return assocArray(root2, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root2, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root2, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root2, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root2.size + 1,
      array: cloneAndSet(root2.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root2;
      }
      return {
        type: ARRAY_NODE,
        size: root2.size,
        array: cloneAndSet(root2.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root2.size,
      array: cloneAndSet(
        root2.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root2;
  }
  return {
    type: ARRAY_NODE,
    size: root2.size,
    array: cloneAndSet(root2.array, idx, n)
  };
}
function assocIndex(root2, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root2.bitmap, bit);
  if ((root2.bitmap & bit) !== 0) {
    const node = root2.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root2;
      }
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root2;
      }
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap,
      array: cloneAndSet(
        root2.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root2.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root2.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root2.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root2.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root2, shift, hash, key, val, addedLeaf) {
  if (hash === root2.hash) {
    const idx = collisionIndexOf(root2, key);
    if (idx !== -1) {
      const entry = root2.array[idx];
      if (entry.v === val) {
        return root2;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root2.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size = root2.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root2.array, size, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root2.hash, shift),
      array: [root2]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root2, key) {
  const size = root2.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key, root2.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root2, shift, hash, key) {
  switch (root2.type) {
    case ARRAY_NODE:
      return findArray(root2, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root2, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root2, key);
  }
}
function findArray(root2, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root2, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root2.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root2.bitmap, bit);
  const node = root2.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root2, key) {
  const idx = collisionIndexOf(root2, key);
  if (idx < 0) {
    return void 0;
  }
  return root2.array[idx];
}
function without(root2, shift, hash, key) {
  switch (root2.type) {
    case ARRAY_NODE:
      return withoutArray(root2, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root2, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root2, key);
  }
}
function withoutArray(root2, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    return root2;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root2;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root2;
    }
  }
  if (n === void 0) {
    if (root2.size <= MIN_ARRAY_NODE) {
      const arr = root2.array;
      const out = new Array(root2.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root2.size - 1,
      array: cloneAndSet(root2.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root2.size,
    array: cloneAndSet(root2.array, idx, n)
  };
}
function withoutIndex(root2, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root2.bitmap & bit) === 0) {
    return root2;
  }
  const idx = index(root2.bitmap, bit);
  const node = root2.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root2;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, n)
      };
    }
    if (root2.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap ^ bit,
      array: spliceOut(root2.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root2.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap ^ bit,
      array: spliceOut(root2.array, idx)
    };
  }
  return root2;
}
function withoutCollision(root2, key) {
  const idx = collisionIndexOf(root2, key);
  if (idx < 0) {
    return root2;
  }
  if (root2.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root2.hash,
    array: spliceOut(root2.array, idx)
  };
}
function forEach(root2, fn) {
  if (root2 === void 0) {
    return;
  }
  const items = root2.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root2, size) {
    this.root = root2;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root2 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root2, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    let equal = true;
    this.forEach((v, k) => {
      equal = equal && isEqual(o.get(k, !v), v);
    });
    return equal;
  }
};

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value) {
  if (/^[-+]?(\d+)$/.test(value)) {
    return new Ok(parseInt(value));
  } else {
    return new Error(Nil);
  }
}
function to_string3(term) {
  return term.toString();
}
function lowercase(string3) {
  return string3.toLowerCase();
}
function split_once(haystack, needle) {
  const index2 = haystack.indexOf(needle);
  if (index2 >= 0) {
    const before = haystack.slice(0, index2);
    const after = haystack.slice(index2 + needle.length);
    return new Ok([before, after]);
  } else {
    return new Error(Nil);
  }
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join();
var left_trim_regex = new RegExp(`^([${unicode_whitespaces}]*)`, "g");
var right_trim_regex = new RegExp(`([${unicode_whitespaces}]*)$`, "g");
function trim(string3) {
  return trim_left(trim_right(string3));
}
function trim_left(string3) {
  return string3.replace(left_trim_regex, "");
}
function trim_right(string3) {
  return string3.replace(right_trim_regex, "");
}
function new_map() {
  return Dict.new();
}
function map_size(map4) {
  return map4.size;
}
function map_to_list(map4) {
  return List.fromArray(map4.entries());
}
function map_get(map4, key) {
  const value = map4.get(key, NOT_FOUND);
  if (value === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value);
}
function map_insert(key, value, map4) {
  return map4.set(key, value);
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function parse(string3) {
  return parse_int(string3);
}
function to_string2(x) {
  return to_string3(x);
}
function compare2(a, b) {
  let $ = a === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}
function add2(a, b) {
  return a + b;
}
function subtract(a, b) {
  return a - b;
}

// build/dev/javascript/gleam_stdlib/gleam/queue.mjs
var Queue = class extends CustomType {
  constructor(in$, out) {
    super();
    this.in = in$;
    this.out = out;
  }
};
function new$2() {
  return new Queue(toList([]), toList([]));
}
function is_empty(queue) {
  return isEqual(queue.in, toList([])) && isEqual(queue.out, toList([]));
}
function push_front(queue, item) {
  return new Queue(queue.in, prepend(item, queue.out));
}
function pop_front(loop$queue) {
  while (true) {
    let queue = loop$queue;
    if (queue instanceof Queue && queue.in.hasLength(0) && queue.out.hasLength(0)) {
      return new Error(void 0);
    } else if (queue instanceof Queue && queue.out.hasLength(0)) {
      let in$ = queue.in;
      loop$queue = new Queue(toList([]), reverse(in$));
    } else {
      let in$ = queue.in;
      let first2 = queue.out.head;
      let rest = queue.out.tail;
      let queue$1 = new Queue(in$, rest);
      return new Ok([first2, queue$1]);
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all2) {
    super();
    this.all = all2;
  }
};
function none() {
  return new Effect(toList([]));
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element = class extends CustomType {
  constructor(key, namespace2, tag2, attrs, children, self_closing, void$) {
    super();
    this.key = key;
    this.namespace = namespace2;
    this.tag = tag2;
    this.attrs = attrs;
    this.children = children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value) {
  return new Attribute(name, from(value), false);
}
function property(name, value) {
  return new Attribute(name, from(value), true);
}
function on(name, handler) {
  return new Event("on" + name, handler);
}
function style(properties) {
  return attribute(
    "style",
    fold(
      properties,
      "",
      (styles, _use1) => {
        let name$1 = _use1[0];
        let value$1 = _use1[1];
        return styles + name$1 + ":" + value$1 + ";";
      }
    )
  );
}
function class$(name) {
  return attribute("class", name);
}
function type_(name) {
  return attribute("type", name);
}
function disabled(is_disabled) {
  return property("disabled", is_disabled);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag2, attrs, children) {
  if (tag2 === "area") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "base") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "br") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "col") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "embed") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "hr") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "img") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "input") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "link") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "meta") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "param") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "source") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "track") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "wbr") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag2, attrs, children, false, false);
  }
}
function namespaced(namespace2, tag2, attrs, children) {
  return new Element("", namespace2, tag2, attrs, children, false, false);
}
function text(content) {
  return new Text(content);
}
function none2() {
  return new Text("");
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Shutdown = class extends CustomType {
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
function morph(prev, next2, dispatch, isComponent = false) {
  let out;
  let stack3 = [{ prev, next: next2, parent: prev.parentNode }];
  while (stack3.length) {
    let { prev: prev2, next: next3, parent } = stack3.pop();
    if (next3.subtree !== void 0)
      next3 = next3.subtree();
    if (next3.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next3.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next3.content)
          prev2.textContent = next3.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next3.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next3.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next3,
        dispatch,
        stack: stack3,
        isComponent
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    } else if (next3.elements !== void 0) {
      iterateElement(next3, (fragmentElement) => {
        stack3.unshift({ prev: prev2, next: fragmentElement, parent });
        prev2 = prev2?.nextSibling;
      });
    } else if (next3.subtree !== void 0) {
      stack3.push({ prev: prev2, next: next3, parent });
    }
  }
  return out;
}
function createElementNode({ prev, next: next2, dispatch, stack: stack3 }) {
  const namespace2 = next2.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next2.tag && prev.namespaceURI === (next2.namespace || "http://www.w3.org/1999/xhtml");
  const el2 = canMorph ? prev : namespace2 ? document.createElementNS(namespace2, next2.tag) : document.createElement(next2.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el2)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el2, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el2);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a) => a.name)) : null;
  let className = null;
  let style2 = null;
  let innerHTML = null;
  for (const attr of next2.attrs) {
    const name = attr[0];
    const value = attr[1];
    if (attr.as_property) {
      if (el2[name] !== value)
        el2[name] = value;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value);
      if (!handlersForEl.has(eventName)) {
        el2.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el2.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el2.setAttribute(name, value);
    } else if (name === "class") {
      className = className === null ? value : className + " " + value;
    } else if (name === "style") {
      style2 = style2 === null ? value : style2 + value;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value;
    } else {
      if (el2.getAttribute(name) !== value)
        el2.setAttribute(name, value);
      if (name === "value" || name === "selected")
        el2[name] = value;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el2.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style2 !== null) {
    el2.setAttribute("style", style2);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el2.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el2.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next2.key !== void 0 && next2.key !== "") {
    el2.setAttribute("data-lustre-key", next2.key);
  } else if (innerHTML !== null) {
    el2.innerHTML = innerHTML;
    return el2;
  }
  let prevChild = el2.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = next2.children[Symbol.iterator]().next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next2);
  }
  for (const child of next2.children) {
    iterateElement(child, (currElement) => {
      if (currElement.key !== void 0 && seenKeys !== null) {
        prevChild = diffKeyedChild(
          prevChild,
          currElement,
          el2,
          stack3,
          incomingKeyedChildren,
          keyedChildren,
          seenKeys
        );
      } else {
        stack3.unshift({ prev: prevChild, next: currElement, parent: el2 });
        prevChild = prevChild?.nextSibling;
      }
    });
  }
  while (prevChild) {
    const next3 = prevChild.nextSibling;
    el2.removeChild(prevChild);
    prevChild = next3;
  }
  return el2;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el2 = event2.currentTarget;
  const tag2 = el2.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el2.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el2.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag: tag2,
    data: include.reduce(
      (data2, property2) => {
        const path2 = property2.split(".");
        for (let i = 0, o = data2, e = event2; i < path2.length; i++) {
          if (i === path2.length - 1) {
            o[path2[i]] = e[path2[i]];
          } else {
            o[path2[i]] ??= {};
            e = e[path2[i]];
            o = o[path2[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el2) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el2) {
    for (const child of el2.children) {
      iterateElement(child, (currElement) => {
        const key = currElement?.key || currElement?.getAttribute?.("data-lustre-key");
        if (key)
          keyedChildren.set(key, currElement);
      });
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el2, stack3, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el2.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    iterateElement(child, (currChild) => {
      stack3.unshift({ prev: prevChild, next: currChild, parent: el2 });
      prevChild = prevChild?.nextSibling;
    });
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack3.unshift({ prev: null, next: child, parent: el2 });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack3.unshift({ prev: null, next: child, parent: el2 });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder = document.createTextNode("");
    el2.insertBefore(placeholder, prevChild);
    stack3.unshift({ prev: placeholder, next: child, parent: el2 });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack3.unshift({ prev: prevChild, next: child, parent: el2 });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el2.insertBefore(keyedChild, prevChild);
  stack3.unshift({ prev: keyedChild, next: child, parent: el2 });
  return prevChild;
}
function iterateElement(element2, processElement) {
  if (element2.elements !== void 0) {
    for (const currElement of element2.elements) {
      processElement(currElement);
    }
  } else {
    processElement(element2);
  }
}

// build/dev/javascript/lustre/client-runtime.ffi.mjs
var LustreClientApplication2 = class _LustreClientApplication {
  #root = null;
  #queue = [];
  #effects = [];
  #didUpdate = false;
  #isComponent = false;
  #model = null;
  #update = null;
  #view = null;
  static start(flags, selector, init3, update3, view3) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root2 = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root2)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(init3(flags), update3, view3, root2);
    return new Ok((msg) => app.send(msg));
  }
  constructor([model, effects], update3, view3, root2 = document.body, isComponent = false) {
    this.#model = model;
    this.#update = update3;
    this.#view = view3;
    this.#root = root2;
    this.#effects = effects.all.toArray();
    this.#didUpdate = true;
    this.#isComponent = isComponent;
    window.requestAnimationFrame(() => this.#tick());
  }
  send(action) {
    switch (true) {
      case action instanceof Dispatch: {
        this.#queue.push(action[0]);
        this.#tick();
        return;
      }
      case action instanceof Shutdown: {
        this.#shutdown();
        return;
      }
      case action instanceof Debug: {
        this.#debug(action[0]);
        return;
      }
      default:
        return;
    }
  }
  emit(event2, data) {
    this.#root.dispatchEvent(
      new CustomEvent(event2, {
        bubbles: true,
        detail: data,
        composed: true
      })
    );
  }
  #tick() {
    this.#flush_queue();
    if (this.#didUpdate) {
      const vdom = this.#view(this.#model);
      const dispatch = (handler) => (e) => {
        const result = handler(e);
        if (result instanceof Ok) {
          this.send(new Dispatch(result[0]));
        }
      };
      this.#didUpdate = false;
      this.#root = morph(this.#root, vdom, dispatch, this.#isComponent);
    }
  }
  #flush_queue(iterations = 0) {
    while (this.#queue.length) {
      const [next2, effects] = this.#update(this.#model, this.#queue.shift());
      this.#didUpdate ||= this.#model !== next2;
      this.#model = next2;
      this.#effects = this.#effects.concat(effects.all.toArray());
    }
    while (this.#effects.length) {
      this.#effects.shift()(
        (msg) => this.send(new Dispatch(msg)),
        (event2, data) => this.emit(event2, data)
      );
    }
    if (this.#queue.length) {
      if (iterations < 5) {
        this.#flush_queue(++iterations);
      } else {
        window.requestAnimationFrame(() => this.#tick());
      }
    }
  }
  #debug(action) {
    switch (true) {
      case action instanceof ForceModel: {
        const vdom = this.#view(action[0]);
        const dispatch = (handler) => (e) => {
          const result = handler(e);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0]));
          }
        };
        this.#queue = [];
        this.#effects = [];
        this.#didUpdate = false;
        this.#root = morph(this.#root, vdom, dispatch, this.#isComponent);
      }
    }
  }
  #shutdown() {
    this.#root.remove();
    this.#root = null;
    this.#model = null;
    this.#queue = [];
    this.#effects = [];
    this.#didUpdate = false;
    this.#update = () => {
    };
    this.#view = () => {
    };
  }
};
var start = (app, selector, flags) => LustreClientApplication2.start(
  flags,
  selector,
  app.init,
  app.update,
  app.view
);
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init3, update3, view3, on_attribute_change) {
    super();
    this.init = init3;
    this.update = update3;
    this.view = view3;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init3, update3, view3) {
  return new App(init3, update3, view3, new None());
}
function simple(init3, update3, view3) {
  let init$1 = (flags) => {
    return [init3(flags), none()];
  };
  let update$1 = (model, msg) => {
    return [update3(model, msg), none()];
  };
  return application(init$1, update$1, view3);
}
function start3(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function h3(attrs, children) {
  return element("h3", attrs, children);
}
function div(attrs, children) {
  return element("div", attrs, children);
}
function br(attrs) {
  return element("br", attrs, toList([]));
}
function svg(attrs, children) {
  return namespaced("http://www.w3.org/2000/svg", "svg", attrs, children);
}
function table(attrs, children) {
  return element("table", attrs, children);
}
function tbody(attrs, children) {
  return element("tbody", attrs, children);
}
function td(attrs, children) {
  return element("td", attrs, children);
}
function tr(attrs, children) {
  return element("tr", attrs, children);
}
function button(attrs, children) {
  return element("button", attrs, children);
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}

// build/dev/javascript/lustre_ui/lustre/ui/button.mjs
function button2(attributes, children) {
  return button(
    prepend(
      class$("lustre-ui-button"),
      prepend(type_("button"), attributes)
    ),
    children
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/layout/stack.mjs
function of(element2, attributes, children) {
  return element2(
    prepend(class$("lustre-ui-stack"), attributes),
    children
  );
}
function stack(attributes, children) {
  return of(div, attributes, children);
}

// build/dev/javascript/lustre_ui/lustre/ui/layout/box.mjs
function of2(element2, attributes, children) {
  return element2(
    prepend(class$("lustre-ui-box"), attributes),
    children
  );
}
function box(attributes, children) {
  return of2(div, attributes, children);
}

// build/dev/javascript/lustre_ui/lustre/ui/layout/group.mjs
function of3(element2, attributes, children) {
  return element2(
    prepend(class$("lustre-ui-group"), attributes),
    children
  );
}
function group(attributes, children) {
  return of3(div, attributes, children);
}

// build/dev/javascript/lustre_ui/lustre/ui.mjs
var box2 = box;
var button3 = button2;
var group2 = group;
var stack2 = stack;

// build/dev/javascript/lustre/lustre/element/svg.mjs
var namespace = "http://www.w3.org/2000/svg";
function path(attrs) {
  return namespaced(namespace, "path", attrs, toList([]));
}

// build/dev/javascript/lustre_ui/lustre/ui/icon.mjs
function icon(attrs, path2) {
  return svg(
    prepend(
      class$("lustre-ui-icon"),
      prepend(
        attribute("viewBox", "0 0 15 15"),
        prepend(attribute("fill", "none"), attrs)
      )
    ),
    toList([
      path(
        toList([
          attribute("d", path2),
          attribute("fill", "currentColor"),
          attribute("fill-rule", "evenodd"),
          attribute("clip-rule", "evenodd")
        ])
      )
    ])
  );
}
function play(attrs) {
  return icon(
    attrs,
    "M3.24182 2.32181C3.3919 2.23132 3.5784 2.22601 3.73338 2.30781L12.7334 7.05781C12.8974 7.14436 13 7.31457 13 7.5C13 7.68543 12.8974 7.85564 12.7334 7.94219L3.73338 12.6922C3.5784 12.774 3.3919 12.7687 3.24182 12.6782C3.09175 12.5877 3 12.4252 3 12.25V2.75C3 2.57476 3.09175 2.4123 3.24182 2.32181ZM4 3.57925V11.4207L11.4288 7.5L4 3.57925Z"
  );
}
function resume(attrs) {
  return icon(
    attrs,
    "M3.04995 2.74995C3.04995 2.44619 2.80371 2.19995 2.49995 2.19995C2.19619 2.19995 1.94995 2.44619 1.94995 2.74995V12.25C1.94995 12.5537 2.19619 12.8 2.49995 12.8C2.80371 12.8 3.04995 12.5537 3.04995 12.25V2.74995ZM5.73333 2.30776C5.57835 2.22596 5.39185 2.23127 5.24177 2.32176C5.0917 2.41225 4.99995 2.57471 4.99995 2.74995V12.25C4.99995 12.4252 5.0917 12.5877 5.24177 12.6781C5.39185 12.7686 5.57835 12.7739 5.73333 12.6921L14.7333 7.94214C14.8973 7.85559 15 7.68539 15 7.49995C15 7.31452 14.8973 7.14431 14.7333 7.05776L5.73333 2.30776ZM5.99995 11.4207V3.5792L13.4287 7.49995L5.99995 11.4207Z"
  );
}
function reset(attrs) {
  return icon(
    attrs,
    "M4.85355 2.14645C5.04882 2.34171 5.04882 2.65829 4.85355 2.85355L3.70711 4H9C11.4853 4 13.5 6.01472 13.5 8.5C13.5 10.9853 11.4853 13 9 13H5C4.72386 13 4.5 12.7761 4.5 12.5C4.5 12.2239 4.72386 12 5 12H9C10.933 12 12.5 10.433 12.5 8.5C12.5 6.567 10.933 5 9 5H3.70711L4.85355 6.14645C5.04882 6.34171 5.04882 6.65829 4.85355 6.85355C4.65829 7.04882 4.34171 7.04882 4.14645 6.85355L2.14645 4.85355C1.95118 4.65829 1.95118 4.34171 2.14645 4.14645L4.14645 2.14645C4.34171 1.95118 4.65829 1.95118 4.85355 2.14645Z"
  );
}
function reload(attrs) {
  return icon(
    attrs,
    "M1.84998 7.49998C1.84998 4.66458 4.05979 1.84998 7.49998 1.84998C10.2783 1.84998 11.6515 3.9064 12.2367 5H10.5C10.2239 5 10 5.22386 10 5.5C10 5.77614 10.2239 6 10.5 6H13.5C13.7761 6 14 5.77614 14 5.5V2.5C14 2.22386 13.7761 2 13.5 2C13.2239 2 13 2.22386 13 2.5V4.31318C12.2955 3.07126 10.6659 0.849976 7.49998 0.849976C3.43716 0.849976 0.849976 4.18537 0.849976 7.49998C0.849976 10.8146 3.43716 14.15 7.49998 14.15C9.44382 14.15 11.0622 13.3808 12.2145 12.2084C12.8315 11.5806 13.3133 10.839 13.6418 10.0407C13.7469 9.78536 13.6251 9.49315 13.3698 9.38806C13.1144 9.28296 12.8222 9.40478 12.7171 9.66014C12.4363 10.3425 12.0251 10.9745 11.5013 11.5074C10.5295 12.4963 9.16504 13.15 7.49998 13.15C4.05979 13.15 1.84998 10.3354 1.84998 7.49998Z"
  );
}

// build/dev/javascript/app/computer/instruction.mjs
var Nop = class extends CustomType {
};
var Inc = class extends CustomType {
  constructor(reg) {
    super();
    this.reg = reg;
  }
};
var Dec = class extends CustomType {
  constructor(reg) {
    super();
    this.reg = reg;
  }
};
var Isz = class extends CustomType {
  constructor(reg) {
    super();
    this.reg = reg;
  }
};
var Jmp = class extends CustomType {
  constructor(addr) {
    super();
    this.addr = addr;
  }
};
var Stp = class extends CustomType {
};

// build/dev/javascript/app/computer/program.mjs
var Program = class extends CustomType {
  constructor(instructions) {
    super();
    this.instructions = instructions;
  }
};
function from_instructions(instructions) {
  let _pipe = instructions;
  let _pipe$1 = index_map(
    _pipe,
    (inst, line) => {
      return [line + 1, inst];
    }
  );
  let _pipe$2 = from_list(_pipe$1);
  return new Program(_pipe$2);
}
function is_valid_address(program, addr) {
  return addr >= 1 && addr <= map_size(program.instructions);
}
function read(program, addr) {
  let _pipe = program.instructions;
  return get(_pipe, addr);
}

// build/dev/javascript/app/computer/compiler.mjs
var CompileErrorInfo = class extends CustomType {
  constructor(error, line) {
    super();
    this.error = error;
    this.line = line;
  }
};
var UnknownCommand = class extends CustomType {
  constructor(got) {
    super();
    this.got = got;
  }
};
var NoArgsExpected = class extends CustomType {
  constructor(got) {
    super();
    this.got = got;
  }
};
var IntArgExpected = class extends CustomType {
  constructor(got) {
    super();
    this.got = got;
  }
};
var RegisterNumberExpected = class extends CustomType {
  constructor(got) {
    super();
    this.got = got;
  }
};
var AddressExpected = class extends CustomType {
  constructor(got) {
    super();
    this.got = got;
  }
};
function parse_reg(args, cb) {
  let $ = parse(args);
  if (!$.isOk()) {
    return new Error(new IntArgExpected(args));
  } else if ($.isOk() && $[0] >= 1) {
    let n = $[0];
    return new Ok(cb(n));
  } else {
    let n = $[0];
    return new Error(new RegisterNumberExpected(n));
  }
}
function parse_addr(args, cb) {
  let $ = parse(args);
  if (!$.isOk()) {
    return new Error(new IntArgExpected(args));
  } else if ($.isOk() && $[0] >= 1) {
    let n = $[0];
    return new Ok(cb(n));
  } else {
    let n = $[0];
    return new Error(new AddressExpected(n));
  }
}
function parse_none(args, a) {
  if (args === "") {
    return new Ok(a);
  } else {
    return new Error(new NoArgsExpected(args));
  }
}
function parse_instruction(line) {
  let $ = (() => {
    let _pipe = line;
    let _pipe$1 = split_once2(_pipe, " ");
    return unwrap(_pipe$1, [line, ""]);
  })();
  let cmd = $[0];
  let args = $[1];
  if (cmd === "") {
    let _pipe = args;
    return parse_none(_pipe, new Nop());
  } else if (cmd === "nop") {
    let _pipe = args;
    return parse_none(_pipe, new Nop());
  } else if (cmd === "inc") {
    let _pipe = args;
    return parse_reg(_pipe, (var0) => {
      return new Inc(var0);
    });
  } else if (cmd === "dec") {
    let _pipe = args;
    return parse_reg(_pipe, (var0) => {
      return new Dec(var0);
    });
  } else if (cmd === "isz") {
    let _pipe = args;
    return parse_reg(_pipe, (var0) => {
      return new Isz(var0);
    });
  } else if (cmd === "jmp") {
    let _pipe = args;
    return parse_addr(_pipe, (var0) => {
      return new Jmp(var0);
    });
  } else if (cmd === "stp") {
    let _pipe = args;
    return parse_none(_pipe, new Stp());
  } else {
    return new Error(new UnknownCommand(cmd));
  }
}
function compile(lines) {
  let _pipe = lines;
  let _pipe$1 = map(_pipe, trim2);
  let _pipe$2 = map(_pipe$1, lowercase2);
  let _pipe$3 = index_map(
    _pipe$2,
    (line, line_no) => {
      let _pipe$32 = line;
      let _pipe$42 = parse_instruction(_pipe$32);
      return map_error(
        _pipe$42,
        (err) => {
          return new CompileErrorInfo(err, line_no + 1);
        }
      );
    }
  );
  let _pipe$4 = all(_pipe$3);
  return map2(_pipe$4, from_instructions);
}

// build/dev/javascript/app/computer/registers.mjs
var Registers = class extends CustomType {
  constructor(regs) {
    super();
    this.regs = regs;
  }
};
function new$5(size) {
  let _pipe = range(1, size);
  let _pipe$1 = map(_pipe, (idx) => {
    return [idx, 0];
  });
  let _pipe$2 = from_list(_pipe$1);
  return new Registers(_pipe$2);
}
function write(regs, addr, value) {
  let $ = (() => {
    let _pipe = regs.regs;
    return has_key(_pipe, addr);
  })();
  if ($) {
    return new Ok(
      (() => {
        let _pipe = regs.regs;
        let _pipe$1 = insert(_pipe, addr, value);
        return new Registers(_pipe$1);
      })()
    );
  } else {
    return new Error(void 0);
  }
}
function read2(regs, reg) {
  let _pipe = regs.regs;
  return get(_pipe, reg);
}
function to_list3(regs) {
  let _pipe = regs.regs;
  let _pipe$1 = map_to_list(_pipe);
  let _pipe$2 = sort(
    _pipe$1,
    (a, b) => {
      return compare2(a[0], b[0]);
    }
  );
  return map(_pipe$2, second);
}
function update(regs, reg, updater) {
  let $ = (() => {
    let _pipe = regs.regs;
    return get(_pipe, reg);
  })();
  if ($.isOk()) {
    let value = $[0];
    return new Ok(
      (() => {
        let _pipe = regs.regs;
        let _pipe$1 = insert(_pipe, reg, updater(value));
        return new Registers(_pipe$1);
      })()
    );
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/app/computer/runtime.mjs
var Runtime = class extends CustomType {
  constructor(program, registers, pc) {
    super();
    this.program = program;
    this.registers = registers;
    this.pc = pc;
  }
};
var Paused = class extends CustomType {
  constructor(at) {
    super();
    this.at = at;
  }
};
var Stopped = class extends CustomType {
  constructor(at) {
    super();
    this.at = at;
  }
};
var AlreadyStopped = class extends CustomType {
};
var UnexpectedEndOfProgram = class extends CustomType {
};
var InvalidAddress = class extends CustomType {
  constructor(addr) {
    super();
    this.addr = addr;
  }
};
var InvalidRegister = class extends CustomType {
  constructor(reg) {
    super();
    this.reg = reg;
  }
};
var JumpRel = class extends CustomType {
  constructor(distance) {
    super();
    this.distance = distance;
  }
};
var JumpAbs = class extends CustomType {
  constructor(addr) {
    super();
    this.addr = addr;
  }
};
function set_pc(rt, addr) {
  let $ = is_valid_address(rt.program, addr);
  if ($) {
    return new Ok(rt.withFields({ pc: new Paused(addr) }));
  } else {
    return new Error(new InvalidAddress(addr));
  }
}
function new$6(program, registers) {
  let _pipe = new Runtime(program, registers, new Paused(0));
  return set_pc(_pipe, 1);
}
function get_pc(rt) {
  return rt.pc;
}
function get_registers(rt) {
  return rt.registers;
}
function next(rt, jump) {
  let $ = rt.pc;
  if (!($ instanceof Paused)) {
    throw makeError(
      "assignment_no_match",
      "computer/runtime",
      102,
      "next",
      "Assignment pattern did not match",
      { value: $ }
    );
  }
  let at = $.at;
  if (jump instanceof JumpRel) {
    let distance = jump.distance;
    let _pipe = rt;
    return set_pc(_pipe, at + distance);
  } else {
    let addr = jump.addr;
    let _pipe = rt;
    return set_pc(_pipe, addr);
  }
}
function exec(rt, instruction) {
  if (instruction instanceof Inc) {
    let reg = instruction.reg;
    let $ = (() => {
      let _pipe = rt.registers;
      return update(
        _pipe,
        reg,
        (_capture) => {
          return add2(_capture, 1);
        }
      );
    })();
    if ($.isOk()) {
      let regs = $[0];
      let _pipe = rt.withFields({ registers: regs });
      return next(_pipe, new JumpRel(1));
    } else {
      return new Error(new InvalidRegister(reg));
    }
  } else if (instruction instanceof Dec) {
    let reg = instruction.reg;
    let $ = (() => {
      let _pipe = rt.registers;
      return update(
        _pipe,
        reg,
        (_capture) => {
          return subtract(_capture, 1);
        }
      );
    })();
    if ($.isOk()) {
      let regs = $[0];
      let _pipe = rt.withFields({ registers: regs });
      return next(_pipe, new JumpRel(1));
    } else {
      return new Error(new InvalidRegister(reg));
    }
  } else if (instruction instanceof Isz) {
    let reg = instruction.reg;
    let $ = (() => {
      let _pipe = rt.registers;
      return read2(_pipe, reg);
    })();
    if ($.isOk() && $[0] === 0) {
      let value = $[0];
      let _pipe = rt;
      return next(_pipe, new JumpRel(2));
    } else if ($.isOk()) {
      let _pipe = rt;
      return next(_pipe, new JumpRel(1));
    } else {
      return new Error(new InvalidRegister(reg));
    }
  } else if (instruction instanceof Jmp) {
    let addr = instruction.addr;
    let _pipe = rt;
    return next(_pipe, new JumpAbs(addr));
  } else if (instruction instanceof Stp) {
    return new Ok(rt.withFields({ pc: new Stopped(rt.pc.at) }));
  } else {
    let _pipe = rt;
    return next(_pipe, new JumpRel(1));
  }
}
function step(rt) {
  let $ = rt.pc;
  if ($ instanceof Stopped) {
    return new Error(new AlreadyStopped());
  } else {
    let at = $.at;
    let $1 = (() => {
      let _pipe = rt.program;
      return read(_pipe, at);
    })();
    if ($1.isOk()) {
      let instruction = $1[0];
      return exec(rt, instruction);
    } else {
      return new Error(new InvalidAddress(at));
    }
  }
}
function run(loop$rt) {
  while (true) {
    let rt = loop$rt;
    let $ = step(rt);
    if ($.isOk()) {
      let rt$1 = $[0];
      let $1 = rt$1.pc;
      if ($1 instanceof Stopped) {
        return new Ok(rt$1);
      } else {
        loop$rt = rt$1;
      }
    } else {
      let err = $;
      return err;
    }
  }
}
function runtime_error_to_string(error) {
  if (error instanceof AlreadyStopped) {
    return "AlreadyStopped";
  } else if (error instanceof UnexpectedEndOfProgram) {
    return "UnexpectedEndOfProgram";
  } else if (error instanceof InvalidAddress) {
    let addr = error.addr;
    return "InvalidAddress: " + to_string2(addr);
  } else {
    let reg = error.reg;
    return "InvalidRegister: " + to_string2(reg);
  }
}

// build/dev/javascript/app/ui/registers.mjs
function view(registers) {
  let border_styles = toList([["border", "1px solid"]]);
  return table(
    toList([style(border_styles)]),
    toList([
      tbody(
        toList([style(border_styles)]),
        (() => {
          let _pipe = registers;
          let _pipe$1 = to_list3(_pipe);
          return index_map(
            _pipe$1,
            (value, index2) => {
              return tr(
                toList([]),
                toList([
                  td(
                    toList([style(border_styles)]),
                    toList([
                      text(
                        (() => {
                          let _pipe$2 = index2 + 1;
                          return to_string2(_pipe$2);
                        })()
                      )
                    ])
                  ),
                  td(
                    toList([style(border_styles)]),
                    toList([
                      text(
                        (() => {
                          let _pipe$2 = value;
                          return to_string2(_pipe$2);
                        })()
                      )
                    ])
                  )
                ])
              );
            }
          );
        })()
      )
    ])
  );
}

// build/dev/javascript/app/ui/table.mjs
function table2(data) {
  let border_styles = toList([["border", "1px solid"]]);
  return table(
    toList([style(border_styles)]),
    toList([
      tbody(
        toList([style(border_styles)]),
        (() => {
          let _pipe = data;
          return map(
            _pipe,
            (row) => {
              return tr(
                toList([]),
                (() => {
                  let _pipe$1 = row;
                  return map(
                    _pipe$1,
                    (col) => {
                      return td(
                        toList([style(border_styles)]),
                        toList([text(col)])
                      );
                    }
                  );
                })()
              );
            }
          );
        })()
      )
    ])
  );
}

// build/dev/javascript/app/app.mjs
var Model = class extends CustomType {
  constructor(lines, rt, error, history) {
    super();
    this.lines = lines;
    this.rt = rt;
    this.error = error;
    this.history = history;
  }
};
var Undo = class extends CustomType {
};
var Reset = class extends CustomType {
};
var Step = class extends CustomType {
};
var Run = class extends CustomType {
};
function init2(_) {
  let lines = toList(["jmp 4", "inc 1", "dec 2", "isz 2", "jmp 2", "stp"]);
  let $ = compile(lines);
  if (!$.isOk()) {
    throw makeError(
      "assignment_no_match",
      "app",
      40,
      "init",
      "Assignment pattern did not match",
      { value: $ }
    );
  }
  let program = $[0];
  let regs = new$5(4);
  let $1 = (() => {
    let _pipe = regs;
    return write(_pipe, 1, 3);
  })();
  if (!$1.isOk()) {
    throw makeError(
      "assignment_no_match",
      "app",
      42,
      "init",
      "Assignment pattern did not match",
      { value: $1 }
    );
  }
  let regs$1 = $1[0];
  let $2 = (() => {
    let _pipe = regs$1;
    return write(_pipe, 2, 4);
  })();
  if (!$2.isOk()) {
    throw makeError(
      "assignment_no_match",
      "app",
      43,
      "init",
      "Assignment pattern did not match",
      { value: $2 }
    );
  }
  let regs$2 = $2[0];
  let $3 = new$6(program, regs$2);
  if (!$3.isOk()) {
    throw makeError(
      "assignment_no_match",
      "app",
      44,
      "init",
      "Assignment pattern did not match",
      { value: $3 }
    );
  }
  let rt = $3[0];
  return new Model(lines, rt, new None(), new$2());
}
function update2(model, msg) {
  if (msg instanceof Run) {
    let $ = (() => {
      let _pipe = model.rt;
      return run(_pipe);
    })();
    if ($.isOk()) {
      let rt = $[0];
      return model.withFields({
        rt,
        history: (() => {
          let _pipe = model.history;
          return push_front(_pipe, model.rt);
        })()
      });
    } else {
      let err = $[0];
      return model.withFields({ error: new Some(err) });
    }
  } else if (msg instanceof Step) {
    let $ = (() => {
      let _pipe = model.rt;
      return step(_pipe);
    })();
    if ($.isOk()) {
      let rt = $[0];
      return model.withFields({
        rt,
        history: (() => {
          let _pipe = model.history;
          return push_front(_pipe, model.rt);
        })()
      });
    } else {
      let err = $[0];
      return model.withFields({ error: new Some(err) });
    }
  } else if (msg instanceof Reset) {
    let $ = (() => {
      let _pipe = model.rt;
      return set_pc(_pipe, 1);
    })();
    if ($.isOk()) {
      let rt = $[0];
      return model.withFields({
        rt,
        error: new None(),
        history: (() => {
          let _pipe = model.history;
          return push_front(_pipe, model.rt);
        })()
      });
    } else {
      let err = $[0];
      return model.withFields({ error: new Some(err) });
    }
  } else {
    let $ = (() => {
      let _pipe = model.history;
      return pop_front(_pipe);
    })();
    if ($.isOk()) {
      let head = $[0][0];
      let rest = $[0][1];
      return model.withFields({
        error: new None(),
        rt: head,
        history: rest
      });
    } else {
      return model;
    }
  }
}
function control_view(model) {
  return group2(
    toList([]),
    toList([
      button3(
        toList([
          on_click(new Undo()),
          disabled(
            (() => {
              let _pipe = model.history;
              return is_empty(_pipe);
            })()
          )
        ]),
        toList([reset(toList([]))])
      ),
      button3(
        toList([on_click(new Reset())]),
        toList([reload(toList([]))])
      ),
      button3(
        toList([on_click(new Step())]),
        toList([resume(toList([]))])
      ),
      button3(
        toList([on_click(new Run())]),
        toList([play(toList([]))])
      ),
      (() => {
        let $ = (() => {
          let _pipe = model.rt;
          return get_pc(_pipe);
        })();
        if ($ instanceof Paused) {
          let at = $.at;
          return text(
            "Paused at " + (() => {
              let _pipe = at;
              return to_string2(_pipe);
            })()
          );
        } else {
          let at = $.at;
          return text(
            "Stopped at " + (() => {
              let _pipe = at;
              return to_string2(_pipe);
            })()
          );
        }
      })(),
      br(toList([])),
      (() => {
        let $ = model.error;
        if ($ instanceof None) {
          return none2();
        } else {
          let err = $[0];
          return text("Error: " + runtime_error_to_string(err));
        }
      })()
    ])
  );
}
function program_view(model) {
  let _pipe = model.lines;
  let _pipe$1 = index_map(
    _pipe,
    (line, idx) => {
      let pc = (() => {
        let _pipe$12 = model.rt;
        return get_pc(_pipe$12);
      })();
      let indicator = (() => {
        let $ = pc.at === idx + 1;
        if (!$) {
          return "";
        } else if ($ && pc instanceof Paused) {
          return ">";
        } else {
          return "*";
        }
      })();
      return toList([indicator, to_string2(idx + 1), line]);
    }
  );
  return table2(_pipe$1);
}
function view2(model) {
  return box2(
    toList([]),
    toList([
      stack2(
        toList([]),
        toList([
          h3(toList([]), toList([text("Registers")])),
          view(
            (() => {
              let _pipe = model.rt;
              return get_registers(_pipe);
            })()
          )
        ])
      ),
      stack2(
        toList([]),
        toList([
          h3(toList([]), toList([text("Control")])),
          control_view(model)
        ])
      ),
      stack2(
        toList([]),
        toList([
          h3(toList([]), toList([text("Program")])),
          program_view(model)
        ])
      )
    ])
  );
}
function main() {
  let app = simple(init2, update2, view2);
  let $ = start3(app, "#app", 0);
  if (!$.isOk()) {
    throw makeError(
      "assignment_no_match",
      "app",
      22,
      "main",
      "Assignment pattern did not match",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
