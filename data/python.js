/*
 * Python question bank (Python 3.10+).
 * Format is documented in CLAUDE.md. Use `backticks` for inline code in
 * question, options and explanation text. Run `node scripts/validate.js` after edits.
 */
registerBank("python", [
  /* ---------- Data Types ---------- */
  {
    id: "python-type-01",
    category: "Data Types",
    difficulty: 1,
    type: "single",
    question: "What does this print?",
    code: "print(0.1 + 0.2 == 0.3)",
    options: ["`False`", "`True`", "`0.30000000000000004`", "It raises a `TypeError`"],
    answer: 0,
    explanation: "Floats are binary approximations, so `0.1 + 0.2` is `0.30000000000000004`, not exactly `0.3`. Compare floats with `math.isclose(a, b)`, or use `decimal.Decimal` for exact decimal arithmetic such as money."
  },
  {
    id: "python-type-02",
    category: "Data Types",
    difficulty: 1,
    type: "text",
    question: "What does this print? Type the exact output.",
    code: "a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)",
    answer: ["[1, 2, 3, 4]", "[1,2,3,4]"],
    explanation: "`b = a` doesn't copy the list; both names refer to the same object, so appending through `b` changes what `a` sees. Use `a.copy()`, `list(a)` or `a[:]` for a shallow copy, or `copy.deepcopy()` for nested data."
  },
  {
    id: "python-type-03",
    category: "Data Types",
    difficulty: 2,
    type: "multi",
    question: "Which of these built-in types are immutable?",
    options: ["`tuple`", "`str`", "`frozenset`", "`list`", "`dict`", "`bytearray`"],
    answer: [0, 1, 2],
    explanation: "`tuple`, `str` and `frozenset` (as well as `int`, `float`, `bytes` and `bool`) can't be changed after creation, which is why they can be dict keys or set members. `list`, `dict`, `set` and `bytearray` are mutable. Note that a tuple holding a list is still immutable itself, but the list inside it can change."
  },
  {
    id: "python-type-04",
    category: "Data Types",
    difficulty: 2,
    type: "single",
    question: "What does this print?",
    code: "print(7 // 2, -7 // 2)",
    options: ["`3 -4`", "`3 -3`", "`3.5 -3.5`", "`4 -4`"],
    answer: 0,
    explanation: "`//` is floor division: it rounds towards negative infinity, so `-7 // 2` is `-4`, not `-3`. Use `int(-7 / 2)` or `math.trunc()` to round towards zero. `%` follows the same rule, so `-7 % 2` is `1`."
  },

  /* ---------- Strings ---------- */
  {
    id: "python-str-01",
    category: "Strings",
    difficulty: 1,
    type: "text",
    question: "What does this print? Type the exact output.",
    code: "print(\"python\"[::-1])",
    answer: ["nohtyp"],
    explanation: "A slice with a step of `-1` walks the sequence backwards, so `s[::-1]` reverses a string, list or tuple."
  },
  {
    id: "python-str-02",
    category: "Strings",
    difficulty: 2,
    type: "single",
    question: "What does this print?",
    code: "print(\"a,b,,c\".split(\",\"))",
    options: [
      "`['a', 'b', '', 'c']`",
      "`['a', 'b', 'c']`",
      "`['a', 'b', None, 'c']`",
      "`['a,b,,c']`"
    ],
    answer: 0,
    explanation: "With an explicit separator, `split` keeps empty strings between adjacent separators. Called with no argument, `split()` splits on runs of whitespace and drops empty strings. For real CSV data, use the `csv` module, which handles quoting."
  },
  {
    id: "python-str-03",
    category: "Strings",
    difficulty: 1,
    type: "text",
    question: "What does this print? Type the exact output.",
    code: "pi = 3.14159\nprint(f\"{pi:.2f}\")",
    answer: ["3.14"],
    explanation: "In an f-string, the format spec after the colon controls formatting: `.2f` means fixed-point with 2 decimal places. Other useful specs are `{n:,}` for thousands separators, `{x:>8}` to right-align in 8 characters and `{r:.1%}` for percentages."
  },

  /* ---------- Control Flow ---------- */
  {
    id: "python-flow-01",
    category: "Control Flow",
    difficulty: 2,
    type: "text",
    question: "What does this print? Type the exact output.",
    code: "for i in range(3):\n    if i == 5:\n        break\nelse:\n    print(\"done\")",
    answer: ["done"],
    explanation: "A loop's `else` block runs when the loop finishes without hitting `break`. Here `i` never reaches 5, so the loop completes and `done` is printed. It's useful for search loops: `break` when found, `else` for not found."
  },
  {
    id: "python-flow-02",
    category: "Control Flow",
    difficulty: 2,
    type: "single",
    question: "What does this print? (Python 3.10+)",
    code: "def describe(point):\n    match point:\n        case (0, 0):\n            return \"origin\"\n        case (x, 0):\n            return f\"x-axis at {x}\"\n        case _:\n            return \"elsewhere\"\n\nprint(describe((3, 0)))",
    options: ["`x-axis at 3`", "`origin`", "`elsewhere`", "`x-axis at x`"],
    answer: 0,
    explanation: "`match` tries each `case` in order. `(0, 0)` fails because the first item is 3. `(x, 0)` matches a two-item sequence whose second item is 0 and binds `x` to 3. `case _` is the wildcard that matches anything."
  },

  /* ---------- Functions ---------- */
  {
    id: "python-func-01",
    category: "Functions",
    difficulty: 3,
    type: "single",
    question: "What does this print?",
    code: "def add(item, items=[]):\n    items.append(item)\n    return items\n\nadd(1)\nprint(add(2))",
    options: ["`[1, 2]`", "`[2]`", "`[1]`", "It raises a `TypeError`"],
    answer: 0,
    explanation: "Default values are evaluated once, when the function is defined, so every call without `items` shares the same list. Use `items=None` and create the list inside: `if items is None: items = []`."
  },
  {
    id: "python-func-02",
    category: "Functions",
    difficulty: 1,
    type: "text",
    question: "What does this print? Type the exact output.",
    code: "def f(*args, **kwargs):\n    return len(args) + len(kwargs)\n\nprint(f(1, 2, a=3))",
    answer: ["3"],
    explanation: "`*args` collects extra positional arguments into a tuple (`(1, 2)`) and `**kwargs` collects keyword arguments into a dict (`{'a': 3}`), so the result is 2 + 1."
  },
  {
    id: "python-func-03",
    category: "Functions",
    difficulty: 3,
    type: "single",
    question: "What does this print?",
    code: "funcs = [lambda: i for i in range(3)]\nprint([f() for f in funcs])",
    options: ["`[2, 2, 2]`", "`[0, 1, 2]`", "`[0, 0, 0]`", "It raises a `NameError`"],
    answer: 0,
    explanation: "Closures look up variables when they are called, not when they are created (late binding). By the time the lambdas run, the loop has finished and `i` is 2. Capture the current value with a default argument: `lambda i=i: i`."
  },
  {
    id: "python-func-04",
    category: "Functions",
    difficulty: 2,
    type: "multi",
    question: "Given `def greet(name, *, greeting=\"Hi\")`, which calls are valid?",
    options: [
      "`greet(\"Ann\")`",
      "`greet(\"Ann\", greeting=\"Hello\")`",
      "`greet(name=\"Ann\")`",
      "`greet(\"Ann\", \"Hello\")`",
      "`greet(greeting=\"Hello\")`"
    ],
    answer: [0, 1, 2],
    explanation: "Parameters after a bare `*` are keyword-only, so `greeting` can't be passed positionally and `greet(\"Ann\", \"Hello\")` raises a `TypeError`. `name` is required, so leaving it out also fails. A `/` in the signature does the opposite and marks the parameters before it as positional-only."
  },

  /* ---------- Collections ---------- */
  {
    id: "python-coll-01",
    category: "Collections",
    difficulty: 1,
    type: "text",
    question: "What does this print? Type the exact output.",
    code: "print([n * n for n in range(6) if n % 2 == 0])",
    answer: ["[0, 4, 16]", "[0,4,16]"],
    explanation: "`range(6)` is 0 to 5, the `if` keeps the even numbers 0, 2 and 4, and each is squared. Swap the brackets for `{}` to build a set, `{k: v ...}` for a dict, or `()` for a lazy generator."
  },
  {
    id: "python-coll-02",
    category: "Collections",
    difficulty: 1,
    type: "single",
    question: "Since Python 3.7, what does the language guarantee about the order of keys in a `dict`?",
    options: [
      "Keys keep the order in which they were inserted",
      "Keys are kept in sorted order",
      "The order is arbitrary and can change between runs",
      "Keys are ordered by their hash value"
    ],
    answer: 0,
    explanation: "Dicts preserve insertion order (an implementation detail in CPython 3.6, guaranteed by the language from 3.7). Updating an existing key keeps its position; deleting and re-adding moves it to the end. Sets make no ordering guarantee."
  },
  {
    id: "python-coll-03",
    category: "Collections",
    difficulty: 3,
    type: "single",
    question: "What does this print?",
    code: "grid = [[0] * 2] * 2\ngrid[0][0] = 1\nprint(grid)",
    options: ["`[[1, 0], [1, 0]]`", "`[[1, 0], [0, 0]]`", "`[[1, 1], [0, 0]]`", "`[[1, 1], [1, 1]]`"],
    answer: 0,
    explanation: "`[row] * 2` repeats a reference to the same inner list, so both rows are the same object and a change through one shows in both. Build independent rows with a comprehension: `[[0] * 2 for _ in range(2)]`."
  },
  {
    id: "python-coll-04",
    category: "Collections",
    difficulty: 2,
    type: "single",
    question: "What does this print?",
    code: "print(sorted([\"banana\", \"apple\", \"Cherry\"]))",
    options: [
      "`['Cherry', 'apple', 'banana']`",
      "`['apple', 'banana', 'Cherry']`",
      "`['banana', 'apple', 'Cherry']`",
      "`['apple', 'banana', 'cherry']`"
    ],
    answer: 0,
    explanation: "Strings sort by Unicode code point, and every upper-case ASCII letter comes before every lower-case one. For a case-insensitive sort use `sorted(words, key=str.lower)` (or `str.casefold`). `sorted` returns a new list; `list.sort()` sorts in place and returns `None`."
  },

  /* ---------- Classes ---------- */
  {
    id: "python-class-01",
    category: "Classes",
    difficulty: 2,
    type: "single",
    question: "What does this print?",
    code: "class Counter:\n    count = 0\n\n    def __init__(self):\n        Counter.count += 1\n\na = Counter()\nb = Counter()\nprint(a.count, b.count)",
    options: ["`2 2`", "`1 1`", "`1 2`", "`0 0`"],
    answer: 0,
    explanation: "`count` is a class attribute shared by all instances, and `__init__` updates it on the class. Reading `a.count` finds no instance attribute, so it falls back to the class value. Writing `self.count += 1` instead would create a separate instance attribute on each object."
  },
  {
    id: "python-class-02",
    category: "Classes",
    difficulty: 2,
    type: "multi",
    question: "With a plain `@dataclass` decorator (no arguments), which statements are true?",
    options: [
      "It generates an `__init__` from the annotated fields",
      "It generates a readable `__repr__`",
      "It generates an `__eq__` that compares fields",
      "Instances are immutable",
      "Field types are checked at runtime when an instance is created"
    ],
    answer: [0, 1, 2],
    explanation: "`@dataclass` writes `__init__`, `__repr__` and `__eq__` for you. Instances are mutable unless you use `@dataclass(frozen=True)`. Type annotations are not enforced at runtime; use a type checker such as mypy, or a library like pydantic, for validation."
  },
  {
    id: "python-class-03",
    category: "Classes",
    difficulty: 1,
    type: "single",
    question: "A class defines both `__str__` and `__repr__`. Which one does `print(obj)` use?",
    options: [
      "`__str__`",
      "`__repr__`",
      "Both, one after the other",
      "Neither; `print` always shows the memory address"
    ],
    answer: 0,
    explanation: "`print()` and `str()` use `__str__`, falling back to `__repr__` if it isn't defined. `repr()`, the interactive prompt and containers (printing a list of objects) use `__repr__`, which should be unambiguous and, ideally, look like code that recreates the object."
  },

  /* ---------- Exceptions ---------- */
  {
    id: "python-exc-01",
    category: "Exceptions",
    difficulty: 3,
    type: "text",
    question: "What does this print? Type the exact output.",
    code: "def f():\n    try:\n        return \"try\"\n    finally:\n        print(\"finally\", end=\" \")\n\nprint(f())",
    answer: ["finally try"],
    explanation: "A `finally` block always runs, even when the `try` block returns. The return value is computed first, then `finally` prints `finally ` (with a space, not a newline), and only then does the outer `print` show `try`."
  },
  {
    id: "python-exc-02",
    category: "Exceptions",
    difficulty: 1,
    type: "single",
    question: "Which exception does `int(\"abc\")` raise?",
    options: ["`ValueError`", "`TypeError`", "`KeyError`", "`SyntaxError`"],
    answer: 0,
    explanation: "The argument is the right type (a string) but has an invalid value, so it's a `ValueError`. A `TypeError` is for the wrong type altogether, such as `int([1])`."
  },
  {
    id: "python-exc-03",
    category: "Exceptions",
    difficulty: 2,
    type: "single",
    question: "Why is a bare `except:` (with no exception type) usually a bad idea?",
    options: [
      "It also catches `KeyboardInterrupt` and `SystemExit`, so Ctrl+C and `sys.exit()` can be swallowed",
      "It is a syntax error in Python 3",
      "It only catches exceptions raised directly in the `try` block, not in functions it calls",
      "It makes the `finally` block run twice"
    ],
    answer: 0,
    explanation: "A bare `except:` catches every `BaseException`, including `KeyboardInterrupt` and `SystemExit`. Catch the specific exceptions you expect, or at most `except Exception:`, and log or re-raise what you can't handle."
  },

  /* ---------- Modules & Tooling ---------- */
  {
    id: "python-tool-01",
    category: "Modules & Tooling",
    difficulty: 1,
    type: "text",
    question: "Type the command that creates a virtual environment in a directory called `.venv`, using only the standard library.",
    answer: [
      "python -m venv .venv",
      "python3 -m venv .venv",
      "py -m venv .venv",
      "py -3 -m venv .venv"
    ],
    explanation: "`python3 -m venv .venv` (or `py -m venv .venv` on Windows) creates an isolated environment. Activate it with `source .venv/bin/activate` on Linux and macOS or `.venv\\Scripts\\activate` on Windows. On Debian and Ubuntu you may need the `python3-venv` package first."
  },
  {
    id: "python-tool-02",
    category: "Modules & Tooling",
    difficulty: 1,
    type: "text",
    question: "Type the `pip` command that installs every package listed in `requirements.txt`.",
    answer: [
      "pip install -r requirements.txt",
      "pip3 install -r requirements.txt",
      "pip install --requirement requirements.txt",
      "pip3 install --requirement requirements.txt",
      "python -m pip install -r requirements.txt",
      "python3 -m pip install -r requirements.txt",
      "py -m pip install -r requirements.txt"
    ],
    explanation: "`pip install -r requirements.txt` installs each listed requirement. `python -m pip ...` is the safer form because it guarantees pip runs for the interpreter you mean (for example, the one in your active venv). `pip freeze > requirements.txt` records what's installed."
  },
  {
    id: "python-tool-03",
    category: "Modules & Tooling",
    difficulty: 1,
    type: "single",
    question: "What does this print?",
    code: "from pathlib import Path\n\nprint(Path(\"/var/log/app.log\").suffix)",
    options: ["`.log`", "`log`", "`app.log`", "`app`"],
    answer: 0,
    explanation: "`suffix` is the final extension including the dot. `name` is `app.log`, `stem` is `app` and `parent` is `/var/log`. pathlib is the modern alternative to string handling with `os.path`."
  },
  {
    id: "python-tool-04",
    category: "Modules & Tooling",
    difficulty: 1,
    type: "single",
    question: "What is the purpose of `if __name__ == \"__main__\":` at the bottom of a script?",
    options: [
      "The code under it runs when the file is executed directly, but not when it is imported as a module",
      "It marks the function Python calls first, like `main()` in C",
      "It is required for a file to be importable",
      "It makes the script run with the system Python rather than a virtual environment"
    ],
    answer: 0,
    explanation: "Python sets `__name__` to `\"__main__\"` for the file being run, and to the module's name when it is imported. The guard lets a file work both as a script and as an importable module without running its script code on import."
  }
]);
