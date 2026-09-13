/* ═══════════════════════════════════════════════════════════════════════
 *  Monaco Autocomplete for Algorithmic Tasks
 *  ────────────────────────────────────────────────────────────────────
 *
 *  Contents:
 *    1. Keywords                       KEYWORDS
 *    2. Snippets                       SNIPPETS
 *    3. Standard types                 TYPES
 *    4. Identifiers from code          extractIdentifiers / getIdentifiers
 *    5. Completion provider            makeCompletionProvider
 *    6. Editor options + hotkeys
 *    7. Entry point (bootstrap)
 *
 *  Supported languages: java, kotlin
 * ═══════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ═══════════════════════════════════════════════════════════════════
     * 7. Entry point (bootstrap)
     * ═══════════════════════════════════════════════════════════════════ */

    const M = window.monaco;
    if (!M || !M.editor) return alert('Monaco Editor not found on page.');

    const editors = M.editor.getEditors();
    if (!editors?.length) return alert('No open editors.');

    const editor = editors.find(e => e.hasTextFocus?.()) || editors[0];
    const model = editor.getModel();
    if (!model) return;

    // Anti-duplicate: dispose providers from a previous bookmarklet run
    if (Array.isArray(window.__acDisposables)) {
        window.__acDisposables.forEach(d => { try { d.dispose(); } catch (_) { } });
    }
    window.__acDisposables = [];

    const K = M.languages.CompletionItemKind;
    const R = M.languages.CompletionItemInsertTextRule;

    /* ═══════════════════════════════════════════════════════════════════
     * 1. Keywords
     * ═══════════════════════════════════════════════════════════════════ */

    const KEYWORDS = {
        java: [
            'public', 'private', 'protected', 'class', 'interface', 'enum', 'record', 'extends', 'implements',
            'void', 'int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'String', 'var',
            'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do', 'break', 'continue', 'return',
            'new', 'import', 'package', 'this', 'super', 'static', 'final', 'abstract', 'synchronized', 'volatile',
            'try', 'catch', 'finally', 'throw', 'throws', 'instanceof', 'null', 'true', 'false', 'yield'
        ],
        kotlin: [
            'fun', 'val', 'var', 'class', 'interface', 'object', 'data', 'sealed', 'enum', 'annotation',
            'if', 'else', 'when', 'for', 'while', 'do', 'break', 'continue', 'return', 'is', 'in', 'as',
            'try', 'catch', 'finally', 'throw', 'null', 'true', 'false', 'this', 'super', 'package', 'import',
            'private', 'public', 'protected', 'internal', 'open', 'override', 'abstract', 'final', 'const',
            'lateinit', 'companion', 'init', 'constructor', 'suspend', 'inline', 'reified', 'operator',
            'infix', 'by', 'where', 'out', 'vararg', 'typealias'
        ]
    };

    /* ═══════════════════════════════════════════════════════════════════
     * 2. Snippets
     * ═══════════════════════════════════════════════════════════════════ */

    const SNIPPETS = {
        java: [
            // Scaffolding
            { l: 'psvm', d: 'main method', t: 'public static void main(String[] args) {\n\t$0\n}' },
            { l: 'class', d: 'class', t: 'public class ${1:Main} {\n\t$0\n}' },
            // Input
            { l: 'Scanner', d: 'Scanner(System.in)', t: 'Scanner ${1:sc} = new Scanner(System.in);' },
            { l: 'nextInt', d: 'sc.nextInt()', t: '${1:sc}.nextInt()' },
            { l: 'nextLine', d: 'sc.nextLine()', t: '${1:sc}.nextLine()' },
            { l: 'readLine', d: 'br.readLine()', t: '${1:br}.readLine()' },
            { l: 'BufferedReader', d: 'BufferedReader', t: 'BufferedReader ${1:br} = new BufferedReader(new InputStreamReader(System.in));' },
            { l: 'StringTokenizer', d: 'StringTokenizer', t: 'StringTokenizer ${1:st} = new StringTokenizer(${2:br}.readLine());' },
            { l: 'nextToken', d: 'st.nextToken()', t: '${1:st}.nextToken()' },
            // Output
            { l: 'System.out.println', d: 'println', t: 'System.out.println(${1:value});' },
            { l: 'System.out.print', d: 'print', t: 'System.out.print(${1:value});' },
            // Data structures
            { l: 'arraylist', d: 'ArrayList', t: 'List<${1:Integer}> ${2:list} = new ArrayList<>();' },
            { l: 'hashmap', d: 'HashMap', t: 'Map<${1:Integer}, ${2:Integer}> ${3:map} = new HashMap<>();' },
            { l: 'hashset', d: 'HashSet', t: 'Set<${1:Integer}> ${2:set} = new HashSet<>();' },
            { l: 'pq', d: 'Min-heap', t: 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();' },
            { l: 'pqmax', d: 'Max-heap', t: 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>(Comparator.reverseOrder());' },
            { l: 'deque', d: 'ArrayDeque', t: 'Deque<${1:Integer}> ${2:dq} = new ArrayDeque<>();' },
            { l: 'treemap', d: 'TreeMap', t: 'TreeMap<${1:Integer}, ${2:Integer}> ${3:map} = new TreeMap<>();' },
            { l: 'sb', d: 'StringBuilder', t: 'StringBuilder ${1:sb} = new StringBuilder();' },
            // Arrays
            { l: 'arr', d: 'array', t: 'int[] ${1:arr} = new int[${2:n}];' },
            { l: 'sort', d: 'Arrays.sort', t: 'Arrays.sort(${1:arr});' },
            { l: 'sortrev', d: 'reverse sort', t: 'Arrays.sort(${1:arr});\n// or for Integer[]:\n// Arrays.sort(${1:arr}, Collections.reverseOrder());' },
            // Loops
            { l: 'fori', d: 'for loop', t: 'for (int ${1:i} = 0; $1 < ${2:n}; $1++) {\n\t$0\n}' },
            { l: 'foreach', d: 'for-each', t: 'for (${1:int} ${2:x} : ${3:arr}) {\n\t$0\n}' },
            // Common patterns
            { l: 'INF', d: 'INF', t: 'static final int INF = Integer.MAX_VALUE / 2;' }
        ],

        kotlin: [
            // Scaffolding
            { l: 'main', d: 'fun main()', t: 'fun main() {\n\t$0\n}' },
            { l: 'fun', d: 'function', t: 'fun ${1:name}(${2:args}): ${3:Int} {\n\t$0\n}' },
            // Input
            { l: 'readln', d: 'readln()', t: 'readln()' },
            { l: 'readln.toInt', d: 'readln().toInt()', t: 'readln().toInt()' },
            { l: 'readInt', d: 'readln().toInt()', t: 'val ${1:n} = readln().toInt()' },
            { l: 'readInts', d: 'split → IntArray', t: 'readln().split(" ").map { it.toInt() }' },
            { l: 'readLongs', d: 'split → LongArray', t: 'readln().split(" ").map { it.toLong() }' },
            { l: 'readlnPair', d: 'parse two numbers', t: 'val (${1:a}, ${2:b}) = readln().split(" ").map { it.toInt() }' },
            // Output
            { l: 'println', d: 'println', t: 'println(${1:value})' },
            { l: 'print', d: 'print', t: 'print(${1:value})' },
            { l: 'joinToString', d: 'joinToString', t: '${1:arr}.joinToString(" ")' },
            // Data structures
            { l: 'listOf', d: 'listOf', t: 'val ${1:list} = listOf(${2:items})' },
            { l: 'mlist', d: 'mutableListOf', t: 'val ${1:list} = mutableListOf<${2:Int}>()' },
            { l: 'mapOf', d: 'mapOf', t: 'val ${1:map} = mapOf(${2:k} to ${3:v})' },
            { l: 'mmap', d: 'mutableMapOf', t: 'val ${1:map} = mutableMapOf<${2:Int}, ${3:Int}>()' },
            { l: 'mset', d: 'mutableSetOf', t: 'val ${1:set} = mutableSetOf<${2:Int}>()' },
            { l: 'pq', d: 'Min-heap', t: 'val ${1:pq} = java.util.PriorityQueue<${2:Int}>()' },
            { l: 'pqmax', d: 'Max-heap', t: 'val ${1:pq} = java.util.PriorityQueue<${2:Int}>(compareByDescending { it })' },
            { l: 'deque', d: 'ArrayDeque', t: 'val ${1:dq} = java.util.ArrayDeque<${2:Int}>()' },
            { l: 'treemap', d: 'TreeMap', t: 'val ${1:map} = java.util.TreeMap<${2:Int}, ${3:Int}>()' },
            { l: 'sb', d: 'StringBuilder', t: 'val ${1:sb} = StringBuilder()' },
            { l: 'pair', d: 'Pair', t: '${1:a} to ${2:b}' },
            { l: 'triple', d: 'Triple', t: 'Triple(${1:a}, ${2:b}, ${3:c})' },
            // Arrays
            { l: 'arr', d: 'IntArray', t: 'val ${1:arr} = IntArray(${2:n})' },
            { l: 'sort', d: 'sorted', t: '${1:arr}.sorted()' },
            { l: 'sortdesc', d: 'sortedDescending', t: '${1:arr}.sortedDescending()' },
            { l: 'sortby', d: 'sortedBy', t: '${1:list}.sortedBy { ${2:it.${3:field}} }' },
            // Loops
            { l: 'fori', d: 'for by index', t: 'for (${1:i} in 0 until ${2:n}) {\n\t$0\n}' },
            { l: 'forin', d: 'for over collection', t: 'for (${1:x} in ${2:collection}) {\n\t$0\n}' },
            // Common patterns
            { l: 'when', d: 'when', t: 'when (${1:value}) {\n\t${2:cond} -> $0\n\telse -> {}\n}' },
            { l: 'INF', d: 'INF', t: 'const val INF = Int.MAX_VALUE / 2' },
            { l: 'swap', d: 'swap', t: '${1:arr}[${2:i}] = ${1:arr}[${3:j}].also { ${1:arr}[$3] = ${1:arr}[$2] }' }
        ]
    };

    /* ═══════════════════════════════════════════════════════════════════
     * 3. Standard types
     * ═══════════════════════════════════════════════════════════════════ */

    const TYPES = {
        kotlin: [
            // Primitives
            'Int', 'Long', 'Short', 'Byte', 'Double', 'Float', 'Boolean', 'Char',
            // Basic reference types
            'String', 'CharSequence', 'Any', 'Unit', 'Nothing',
            // Arrays
            'Array', 'ByteArray', 'ShortArray', 'IntArray', 'LongArray',
            'FloatArray', 'DoubleArray', 'BooleanArray', 'CharArray',
            // Collections
            'List', 'MutableList', 'Set', 'MutableSet', 'Map', 'MutableMap',
            'Collection', 'Iterable', 'Sequence',
            'Pair', 'Triple', 'IntRange',
            // Algorithm-oriented structures
            'StringBuilder',
            'PriorityQueue', 'ArrayDeque', 'TreeMap', 'TreeSet', 'LinkedList',
            // I/O
            'Scanner', 'BufferedReader', 'StringTokenizer',
            // Math
            'Math', 'BigInteger',
            // Exceptions
            'Exception'
        ],
        java: [
            // Boxed primitives
            'Integer', 'Long', 'Short', 'Byte', 'Double', 'Float', 'Boolean', 'Character',
            // Basic reference types
            'String', 'CharSequence', 'Object', 'Void', 'StringBuilder', 'StringBuffer',
            // Arrays and utilities
            'Arrays', 'Collections', 'Objects', 'Math', 'System',
            // Collections
            'List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'TreeMap', 'LinkedHashMap',
            'Set', 'HashSet', 'TreeSet', 'LinkedHashSet',
            'Queue', 'Deque', 'ArrayDeque', 'PriorityQueue', 'Stack',
            'Collection', 'Iterable', 'Iterator',
            // Input
            'Scanner', 'BufferedReader', 'InputStreamReader', 'StringTokenizer',
            // Functional
            'Comparator', 'Comparable',
            // Big numbers
            'BigInteger', 'BigDecimal',
            // Exceptions
            'Exception', 'RuntimeException'
        ]
    };

    /* ═══════════════════════════════════════════════════════════════════
     * 4. Identifiers from code
     * ═══════════════════════════════════════════════════════════════════ */

    const STOP = new Set([
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'return', 'break', 'continue', 'new', 'throw',
        'try', 'catch', 'finally', 'when', 'in', 'is', 'as', 'fun', 'val', 'var', 'class',
        'interface', 'object', 'enum', 'this', 'super', 'true', 'false', 'null', 'package', 'import'
    ]);

    function extractIdentifiers(text, lang) {
        const found = new Map();
        const PRIO = { Class: 1, Function: 2, Method: 2, Property: 3, Field: 3, Variable: 4 };

        const add = (name, kind) => {
            if (!name || name.length < 2 || name.length > 60) return;
            if (STOP.has(name)) return;
            const prev = found.get(name);
            if (!prev || PRIO[kind] < PRIO[prev]) found.set(name, kind);
        };

        if (lang === 'java') {
            for (const m of text.matchAll(/\b(?:class|interface|enum)\s+([A-Z]\w*)/g))
                add(m[1], 'Class');
            for (const m of text.matchAll(/\b([a-z_$]\w*)\s*\(/g))
                add(m[1], 'Method');
            for (const m of text.matchAll(
                /\b(?:[A-Z]\w*|int|long|double|float|boolean|char|byte|short|String|var|Object|List|Map|Set)(?:<[^>]*>)?(?:\[\])?\s+([a-z_$]\w*)/g
            )) add(m[1], 'Field');
        } else if (lang === 'kotlin') {
            for (const m of text.matchAll(/\b(?:class|interface|object)\s+([A-Z]\w*)/g))
                add(m[1], 'Class');
            for (const m of text.matchAll(/\bfun\s+(?:[\w<>,.\[\]?]+\.)?([a-zA-Z_]\w*)\s*\(/g))
                add(m[1], 'Function');
            for (const m of text.matchAll(/\b(?:val|var)\s+([a-zA-Z_]\w*)/g))
                add(m[1], 'Property');
            for (const m of text.matchAll(/\b([a-z_]\w*)\s*:\s*[A-Z]\w*/g))
                add(m[1], 'Variable');
        }

        return [...found.entries()].map(([name, kind]) => ({ name, kind }));
    }

    /* Identifier cache + reset on changes */
    let idCache = { text: '', lang: '', items: [] };
    function getIdentifiers(model) {
        const text = model.getValue();
        const lang = model.getLanguageId();
        if (idCache.text === text && idCache.lang === lang) return idCache.items;
        idCache = { text, lang, items: extractIdentifiers(text, lang) };
        return idCache.items;
    }

    let idTimer = null;
    window.__acDisposables.push(model.onDidChangeContent(() => {
        clearTimeout(idTimer);
        idTimer = setTimeout(() => { idCache = { text: '', lang: '', items: [] }; }, 500);
    }));

    /* ═══════════════════════════════════════════════════════════════════
     * 5. Completion provider
     * ═══════════════════════════════════════════════════════════════════ */

    const KIND_MAP = {
        Class: K.Class,
        Method: K.Method,
        Function: K.Function,
        Field: K.Field,
        Property: K.Property,
        Variable: K.Variable
    };

    const makeCompletionProvider = (lang) => M.languages.registerCompletionItemProvider(lang, {
        triggerCharacters: ['.', ':', '<', '@'],

        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [];

            // 1. Snippets
            (SNIPPETS[lang] || []).forEach(s => suggestions.push({
                label: s.l,
                kind: K.Snippet,
                detail: 'snippet',
                documentation: { value: '```' + lang + '\n' + s.t + '\n```' },
                insertText: s.t,
                insertTextRules: R.InsertAsSnippet,
                range,
                sortText: '1_' + s.l
            }));

            // 2. Identifiers from the current document
            getIdentifiers(model).forEach(id => suggestions.push({
                label: id.name,
                kind: KIND_MAP[id.kind] ?? K.Text,
                insertText: id.name,
                range,
                sortText: '2_' + id.name
            }));

            // 3. Standard types
            (TYPES[lang] || []).forEach(t => suggestions.push({
                label: t,
                kind: K.Class,
                detail: 'type',
                insertText: t,
                range,
                sortText: '3_' + t
            }));

            // 4. Keywords
            (KEYWORDS[lang] || []).forEach(kw => suggestions.push({
                label: kw,
                kind: K.Keyword,
                insertText: kw,
                range,
                sortText: '4_' + kw
            }));

            return { suggestions };
        }
    });

    ['java', 'kotlin'].forEach(lang => {
        const d = makeCompletionProvider(lang);
        if (d) window.__acDisposables.push(d);
    });

    /* ═══════════════════════════════════════════════════════════════════
     * 6. Editor options + hotkeys
     * ═══════════════════════════════════════════════════════════════════ */

    editor.updateOptions({
        quickSuggestions: { other: true, comments: false, strings: false },
        suggestOnTriggerCharacters: true,
        tabCompletion: 'on',
        acceptSuggestionOnEnter: 'smart',
        wordBasedSuggestions: true,
        snippetSuggestions: 'top',
        suggest: {
            showKeywords: true,
            showSnippets: true,
            showWords: true,
            showClasses: true,
            showMethods: true,
            showFunctions: true,
            showVariables: true,
            showFields: true,
            showProperties: true
        }
        // inlineSuggest is intentionally NOT enabled
    });

    // Ctrl+Space / Cmd+Space — force open the suggestion widget
    editor.addCommand(M.KeyMod.CtrlCmd | M.KeyCode.Space, () => {
        editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });

    // Tab — open the suggestion widget when it is closed and nothing is selected.
    // When the widget is open, Tab accepts the highlighted suggestion.
    editor.addCommand(
        M.KeyCode.Tab,
        () => editor.trigger('keyboard', 'editor.action.triggerSuggest', {}),
        'editorTextFocus && !suggestWidgetVisible && !editorHasSelection ' +
        '&& !editorHasMultipleSelections && !editorTabMovesFocus && !inSnippetMode'
    );

    console.log('%c✅ Autocomplete activated',
        'color:#4caf50;font-weight:bold');
})();
