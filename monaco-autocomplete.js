/* ═══════════════════════════════════════════════════════════════════════
 *  Monaco Autocomplete for Algorithmic Tasks
 *
 *  Contents:
 *    1. Keywords                       KEYWORDS
 *    2. Snippets                       SNIPPETS
 *    3. Standard types                 TYPES
 *    4. Identifiers + type map         extractIdentifiers / buildTypeMap
 *    5. Method table                   METHODS
 *    6. Completion provider            makeCompletionProvider
 *    7. Editor options + hotkeys
 *    8. Entry point (bootstrap)
 *
 *  Supported languages: java, kotlin
 * ═══════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ═══════════════════════════════════════════════════════════════════
     * 8. Entry point (bootstrap)
     * ═══════════════════════════════════════════════════════════════════ */

    const M = window.monaco;
    if (!M || !M.editor) return alert('Monaco Editor not found on page.');

    const editors = M.editor.getEditors();
    if (!editors?.length) return alert('No open editors.');

    const editor = editors.find(e => e.hasTextFocus?.()) || editors[0];
    const model = editor.getModel();
    if (!model) return;

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
            { l: 'psvm', d: 'main method', t: 'public static void main(String[] args) {\n\t$0\n}' },
            { l: 'class', d: 'class', t: 'public class ${1:Main} {\n\t$0\n}' },
            { l: 'Scanner', d: 'Scanner(System.in)', t: 'Scanner ${1:sc} = new Scanner(System.in);' },
            { l: 'nextInt', d: 'sc.nextInt()', t: '${1:sc}.nextInt()' },
            { l: 'nextLine', d: 'sc.nextLine()', t: '${1:sc}.nextLine()' },
            { l: 'readLine', d: 'br.readLine()', t: '${1:br}.readLine()' },
            { l: 'BufferedReader', d: 'BufferedReader', t: 'BufferedReader ${1:br} = new BufferedReader(new InputStreamReader(System.in));' },
            { l: 'StringTokenizer', d: 'StringTokenizer', t: 'StringTokenizer ${1:st} = new StringTokenizer(${2:br}.readLine());' },
            { l: 'nextToken', d: 'st.nextToken()', t: '${1:st}.nextToken()' },
            { l: 'System.out.println', d: 'println', t: 'System.out.println(${1:value});' },
            { l: 'System.out.print', d: 'print', t: 'System.out.print(${1:value});' },
            { l: 'arraylist', d: 'ArrayList', t: 'List<${1:Integer}> ${2:list} = new ArrayList<>();' },
            { l: 'hashmap', d: 'HashMap', t: 'Map<${1:Integer}, ${2:Integer}> ${3:map} = new HashMap<>();' },
            { l: 'hashset', d: 'HashSet', t: 'Set<${1:Integer}> ${2:set} = new HashSet<>();' },
            { l: 'pq', d: 'Min-heap', t: 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();' },
            { l: 'pqmax', d: 'Max-heap', t: 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>(Comparator.reverseOrder());' },
            { l: 'deque', d: 'ArrayDeque', t: 'Deque<${1:Integer}> ${2:dq} = new ArrayDeque<>();' },
            { l: 'treemap', d: 'TreeMap', t: 'TreeMap<${1:Integer}, ${2:Integer}> ${3:map} = new TreeMap<>();' },
            { l: 'sb', d: 'StringBuilder', t: 'StringBuilder ${1:sb} = new StringBuilder();' },
            { l: 'arr', d: 'array', t: 'int[] ${1:arr} = new int[${2:n}];' },
            { l: 'sort', d: 'Arrays.sort', t: 'Arrays.sort(${1:arr});' },
            { l: 'sortrev', d: 'reverse sort', t: 'Arrays.sort(${1:arr});\n// or for Integer[]:\n// Arrays.sort(${1:arr}, Collections.reverseOrder());' },
            { l: 'fori', d: 'for loop', t: 'for (int ${1:i} = 0; $1 < ${2:n}; $1++) {\n\t$0\n}' },
            { l: 'foreach', d: 'for-each', t: 'for (${1:int} ${2:x} : ${3:arr}) {\n\t$0\n}' },
            { l: 'INF', d: 'INF', t: 'static final int INF = Integer.MAX_VALUE / 2;' }
        ],
        kotlin: [
            { l: 'main', d: 'fun main()', t: 'fun main() {\n\t$0\n}' },
            { l: 'fun', d: 'function', t: 'fun ${1:name}(${2:args}): ${3:Int} {\n\t$0\n}' },
            { l: 'readln', d: 'readln()', t: 'readln()' },
            { l: 'readln.toInt', d: 'readln().toInt()', t: 'readln().toInt()' },
            { l: 'readInt', d: 'readln().toInt()', t: 'val ${1:n} = readln().toInt()' },
            { l: 'readInts', d: 'split → IntArray', t: 'readln().split(" ").map { it.toInt() }' },
            { l: 'readLongs', d: 'split → LongArray', t: 'readln().split(" ").map { it.toLong() }' },
            { l: 'readlnPair', d: 'parse two numbers', t: 'val (${1:a}, ${2:b}) = readln().split(" ").map { it.toInt() }' },
            { l: 'println', d: 'println', t: 'println(${1:value})' },
            { l: 'print', d: 'print', t: 'print(${1:value})' },
            { l: 'joinToString', d: 'joinToString', t: '${1:arr}.joinToString(" ")' },
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
            { l: 'arr', d: 'IntArray', t: 'val ${1:arr} = IntArray(${2:n})' },
            { l: 'sort', d: 'sorted', t: '${1:arr}.sorted()' },
            { l: 'sortdesc', d: 'sortedDescending', t: '${1:arr}.sortedDescending()' },
            { l: 'sortby', d: 'sortedBy', t: '${1:list}.sortedBy { ${2:it.${3:field}} }' },
            { l: 'fori', d: 'for by index', t: 'for (${1:i} in 0 until ${2:n}) {\n\t$0\n}' },
            { l: 'forin', d: 'for over collection', t: 'for (${1:x} in ${2:collection}) {\n\t$0\n}' },
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
            'Int', 'Long', 'Short', 'Byte', 'Double', 'Float', 'Boolean', 'Char',
            'String', 'CharSequence', 'Any', 'Unit', 'Nothing',
            'Array', 'ByteArray', 'ShortArray', 'IntArray', 'LongArray',
            'FloatArray', 'DoubleArray', 'BooleanArray', 'CharArray',
            'List', 'MutableList', 'Set', 'MutableSet', 'Map', 'MutableMap',
            'Collection', 'Iterable', 'Sequence',
            'Pair', 'Triple', 'IntRange',
            'StringBuilder',
            'PriorityQueue', 'ArrayDeque', 'TreeMap', 'TreeSet', 'LinkedList',
            'Scanner', 'BufferedReader', 'StringTokenizer',
            'Math', 'BigInteger',
            'Exception'
        ],
        java: [
            'Integer', 'Long', 'Short', 'Byte', 'Double', 'Float', 'Boolean', 'Character',
            'String', 'CharSequence', 'Object', 'Void', 'StringBuilder', 'StringBuffer',
            'Arrays', 'Collections', 'Objects', 'Math', 'System',
            'List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'TreeMap', 'LinkedHashMap',
            'Set', 'HashSet', 'TreeSet', 'LinkedHashSet',
            'Queue', 'Deque', 'ArrayDeque', 'PriorityQueue', 'Stack',
            'Collection', 'Iterable', 'Iterator',
            'Scanner', 'BufferedReader', 'InputStreamReader', 'StringTokenizer',
            'Comparator', 'Comparable',
            'BigInteger', 'BigDecimal',
            'Exception', 'RuntimeException'
        ]
    };

    /* ═══════════════════════════════════════════════════════════════════
     * 4. Identifiers + type map from code
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

    const JAVA_DECL_RE = /\b(int|long|double|float|boolean|char|byte|short|String|StringBuilder|StringBuffer|List|ArrayList|LinkedList|Map|HashMap|TreeMap|LinkedHashMap|Set|HashSet|TreeSet|LinkedHashSet|Queue|Deque|ArrayDeque|PriorityQueue|Stack|Scanner|BufferedReader|StringTokenizer|BigInteger|BigDecimal|Integer|Long|Double|Boolean|Character|Object)\s*(?:<[^>]*>)?\s*((?:\[\s*\])*)\s+([a-z_$][\w$]*)/g;

    const KOTLIN_EXPLICIT_RE = /\b(?:val|var)\s+([a-zA-Z_]\w*)\s*:\s*([A-Z][\w<>, ]*?)(?=\s*[=\n;]|$)/g;
    const KOTLIN_IMPLICIT_RE = /\b(?:val|var)\s+([a-zA-Z_]\w*)\s*=\s*([^\n;]+)/g;

    function inferKotlinType(expr) {
        const e = expr.trim();

        if (/^IntArray\s*\(/.test(e))      return 'IntArray';
        if (/^LongArray\s*\(/.test(e))     return 'LongArray';
        if (/^DoubleArray\s*\(/.test(e))   return 'DoubleArray';
        if (/^FloatArray\s*\(/.test(e))    return 'FloatArray';
        if (/^BooleanArray\s*\(/.test(e))  return 'BooleanArray';
        if (/^CharArray\s*\(/.test(e))     return 'CharArray';
        if (/^ByteArray\s*\(/.test(e))     return 'ByteArray';
        if (/^ShortArray\s*\(/.test(e))    return 'ShortArray';
        if (/^Array\s*\(/.test(e))         return 'Array';

        if (/^(mutableListOf|arrayListOf|ArrayList)\b/.test(e)) return 'MutableList';
        if (/^listOf\b/.test(e))           return 'List';
        if (/^(mutableMapOf|hashMapOf|HashMap)\b/.test(e))      return 'MutableMap';
        if (/^mapOf\b/.test(e))            return 'Map';
        if (/^(mutableSetOf|hashSetOf|HashSet)\b/.test(e))      return 'MutableSet';
        if (/^setOf\b/.test(e))            return 'Set';

        if (/(?:java\.util\.)?PriorityQueue\b/.test(e)) return 'PriorityQueue';
        if (/(?:java\.util\.)?ArrayDeque\b/.test(e))    return 'ArrayDeque';
        if (/(?:java\.util\.)?TreeMap\b/.test(e))       return 'TreeMap';
        if (/(?:java\.util\.)?TreeSet\b/.test(e))       return 'TreeSet';
        if (/(?:java\.util\.)?LinkedList\b/.test(e))    return 'MutableList';
        if (/^StringBuilder\s*\(/.test(e)) return 'StringBuilder';

        if (/^readln\(\)\.toInt\(\)/.test(e))    return 'Int';
        if (/^readln\(\)\.toLong\(\)/.test(e))   return 'Long';
        if (/^readln\(\)\.toDouble\(\)/.test(e)) return 'Double';
        if (/^readln\(\)\.split/.test(e))        return 'List';
        if (/^readln\(\)/.test(e))               return 'String';

        if (/^Triple\s*\(/.test(e)) return 'Triple';
        if (/\bto\b/.test(e))       return 'Pair';

        if (/^"/.test(e))               return 'String';
        if (/^'/.test(e))               return 'Char';
        if (/^(true|false)\b/.test(e))  return 'Boolean';
        if (/^-?\d+L\b/.test(e))        return 'Long';
        if (/^-?\d+\.\d+/.test(e))      return 'Double';
        if (/^-?\d+\b/.test(e))         return 'Int';

        return null;
    }

    function buildTypeMap(text, lang) {
        const map = new Map();

        if (lang === 'java') {
            JAVA_DECL_RE.lastIndex = 0;
            let m;
            while ((m = JAVA_DECL_RE.exec(text)) !== null) {
                const baseType = m[1];
                const isArray = m[2] && m[2].length > 0;
                const name = m[3];
                map.set(name, isArray ? baseType + '[]' : baseType);
            }
        } else if (lang === 'kotlin') {
            for (const m of text.matchAll(KOTLIN_EXPLICIT_RE)) {
                map.set(m[1], m[2].split('<')[0].trim());
            }
            for (const m of text.matchAll(KOTLIN_IMPLICIT_RE)) {
                const name = m[1];
                if (map.has(name)) continue;
                const inferred = inferKotlinType(m[2]);
                if (inferred) map.set(name, inferred);
            }
        }

        return map;
    }

    const TYPE_ALIASES = {
        'ArrayList': 'List',
        'LinkedList': 'List',
        'MutableList': 'List',
        'HashMap': 'Map',
        'TreeMap': 'Map',
        'LinkedHashMap': 'Map',
        'MutableMap': 'Map',
        'HashSet': 'Set',
        'TreeSet': 'Set',
        'LinkedHashSet': 'Set',
        'MutableSet': 'Set',
        'StringBuffer': 'StringBuilder',
        'Deque': 'ArrayDeque'
    };

    function normalizeType(type) {
        if (!type) return null;
        const base = type.split('<')[0].trim();
        return TYPE_ALIASES[base] || base;
    }

    let idCache = { text: '', lang: '', items: [] };
    let typeCache = { text: '', lang: '', map: new Map() };

    function getIdentifiers(model) {
        const text = model.getValue();
        const lang = model.getLanguageId();
        if (idCache.text === text && idCache.lang === lang) return idCache.items;
        idCache = { text, lang, items: extractIdentifiers(text, lang) };
        return idCache.items;
    }

    function getTypeMap(model) {
        const text = model.getValue();
        const lang = model.getLanguageId();
        if (typeCache.text === text && typeCache.lang === lang) return typeCache.map;
        typeCache = { text, lang, map: buildTypeMap(text, lang) };
        return typeCache.map;
    }

    let idTimer = null;
    window.__acDisposables.push(model.onDidChangeContent(() => {
        clearTimeout(idTimer);
        idTimer = setTimeout(() => {
            idCache = { text: '', lang: '', items: [] };
            typeCache = { text: '', lang: '', map: new Map() };
        }, 500);
    }));

    /* ═══════════════════════════════════════════════════════════════════
     * 5. Method table
     *
     *  Entry formats:
     *    'name'      → property / no-parens call
     *    'name()'    → method without args (label strips the parentheses)
     *    { l, t }    → custom insert text; snippet mode if t contains ${...}
     * ═══════════════════════════════════════════════════════════════════ */

    const METHODS = {
        /* ── String ── */
        'String': [
            'length', 'indices', 'lastIndex',
            'first', 'last', 'firstOrNull', 'lastOrNull',
            { l: 'get',        t: 'get(${1:index})' },
            { l: 'charAt',     t: 'charAt(${1:index})' },
            { l: 'elementAt',  t: 'elementAt(${1:index})' },

            { l: 'substring',           t: 'substring(${1:start}, ${2:end})' },
            { l: 'substringAfter',      t: 'substringAfter(${1:delimiter})' },
            { l: 'substringBefore',     t: 'substringBefore(${1:delimiter})' },
            { l: 'substringAfterLast',  t: 'substringAfterLast(${1:delimiter})' },
            { l: 'substringBeforeLast', t: 'substringBeforeLast(${1:delimiter})' },
            { l: 'take',     t: 'take(${1:n})' },
            { l: 'takeLast', t: 'takeLast(${1:n})' },
            { l: 'drop',     t: 'drop(${1:n})' },
            { l: 'dropLast', t: 'dropLast(${1:n})' },
            { l: 'slice',    t: 'slice(${1:range})' },

            { l: 'indexOf',     t: 'indexOf(${1:char})' },
            { l: 'lastIndexOf', t: 'lastIndexOf(${1:char})' },
            { l: 'contains',    t: 'contains(${1:substring})' },
            { l: 'startsWith',  t: 'startsWith(${1:prefix})' },
            { l: 'endsWith',    t: 'endsWith(${1:suffix})' },
            { l: 'matches',     t: 'matches(${1:regex})' },

            'trim()', 'trimStart()', 'trimEnd()', 'trimIndent()', 'trimMargin()',
            'uppercase()', 'lowercase()', 'reversed()',
            { l: 'repeat',          t: 'repeat(${1:n})' },
            { l: 'replace',         t: 'replace(${1:old}, ${2:new})' },
            { l: 'replaceFirst',    t: 'replaceFirst(${1:old}, ${2:new})' },
            { l: 'removePrefix',    t: 'removePrefix(${1:prefix})' },
            { l: 'removeSuffix',    t: 'removeSuffix(${1:suffix})' },
            { l: 'padStart',        t: 'padStart(${1:length}, ${2:\'0\'})' },
            { l: 'padEnd',          t: 'padEnd(${1:length}, ${2:\'0\'})' },

            { l: 'split',           t: 'split(${1:\" \"})' },
            'lines()',

            'toInt()', 'toIntOrNull()', 'toLong()', 'toLongOrNull()',
            'toDouble()', 'toDoubleOrNull()', 'toFloat()', 'toBoolean()',
            'toCharArray()', 'toList()', 'toSet()', 'toMutableList()', 'toByteArray()',
            'toString()',

            'isEmpty()', 'isNotEmpty()', 'isBlank()', 'isNotBlank()',
            { l: 'equals',           t: 'equals(${1:other})' },
            { l: 'equalsIgnoreCase', t: 'equalsIgnoreCase(${1:other})' },

            { l: 'map',           t: 'map { ${1:it} -> $0 }' },
            { l: 'filter',        t: 'filter { ${1:it} -> $0 }' },
            { l: 'filterNot',     t: 'filterNot { ${1:it} -> $0 }' },
            { l: 'forEach',       t: 'forEach { ${1:it} -> $0 }' },
            { l: 'forEachIndexed',t: 'forEachIndexed { ${1:i}, ${2:c} -> $0 }' },
            { l: 'count',         t: 'count { ${1:it} -> $0 }' },
            { l: 'any',           t: 'any { ${1:it} -> $0 }' },
            { l: 'all',           t: 'all { ${1:it} -> $0 }' },
            { l: 'none',          t: 'none { ${1:it} -> $0 }' },
            { l: 'find',          t: 'find { ${1:it} -> $0 }' },
            { l: 'fold',          t: 'fold(${1:0}) { ${2:acc}, ${3:it} -> $0 }' },
            { l: 'reduce',        t: 'reduce { ${1:acc}, ${2:it} -> $0 }' },

            { l: 'compareTo',           t: 'compareTo(${1:other})' },
            { l: 'compareToIgnoreCase', t: 'compareToIgnoreCase(${1:other})' }
        ],

        'StringBuilder': [
            { l: 'append',       t: 'append(${1:value})' },
            { l: 'insert',       t: 'insert(${1:index}, ${2:value})' },
            { l: 'delete',       t: 'delete(${1:start}, ${2:end})' },
            { l: 'deleteCharAt', t: 'deleteCharAt(${1:index})' },
            { l: 'replace',      t: 'replace(${1:start}, ${2:end}, ${3:str})' },
            'reverse()',
            'toString()',
            'length',
            { l: 'charAt',    t: 'charAt(${1:index})' },
            { l: 'setLength', t: 'setLength(${1:newLength})' },
            { l: 'indexOf',   t: 'indexOf(${1:str})' },
            { l: 'substring', t: 'substring(${1:start}, ${2:end})' }
        ],

        /* ── Kotlin primitives ── */
        'Int': [
            'toByte()', 'toShort()', 'toInt()', 'toLong()', 'toFloat()', 'toDouble()',
            'toChar()', 'toString()', 'toBigInteger()',
            { l: 'coerceAtLeast', t: 'coerceAtLeast(${1:minimumValue})' },
            { l: 'coerceAtMost',  t: 'coerceAtMost(${1:maximumValue})' },
            { l: 'coerceIn',      t: 'coerceIn(${1:minimumValue}, ${2:maximumValue})' },
            'inc()', 'dec()', 'unaryMinus()',
            { l: 'plus',     t: 'plus(${1:other})' },
            { l: 'minus',    t: 'minus(${1:other})' },
            { l: 'times',    t: 'times(${1:other})' },
            { l: 'div',      t: 'div(${1:other})' },
            { l: 'rem',      t: 'rem(${1:other})' },
            { l: 'mod',      t: 'mod(${1:other})' },
            { l: 'floorDiv', t: 'floorDiv(${1:other})' },
            { l: 'and',      t: 'and(${1:other})' },
            { l: 'or',       t: 'or(${1:other})' },
            { l: 'xor',      t: 'xor(${1:other})' },
            'inv()',
            { l: 'shl',  t: 'shl(${1:bitCount})' },
            { l: 'shr',  t: 'shr(${1:bitCount})' },
            { l: 'ushr', t: 'ushr(${1:bitCount})' },
            'countOneBits()', 'countLeadingZeroBits()', 'countTrailingZeroBits()',
            'takeHighestOneBit()', 'takeLowestOneBit()',
            { l: 'rotateLeft',  t: 'rotateLeft(${1:bitCount})' },
            { l: 'rotateRight', t: 'rotateRight(${1:bitCount})' },
            { l: 'rangeTo', t: 'rangeTo(${1:other})' },
            { l: 'downTo',  t: 'downTo(${1:to})' },
            { l: 'until',   t: 'until(${1:to})' },
            { l: 'step',    t: 'step(${1:step})' },
            { l: 'compareTo', t: 'compareTo(${1:other})' },
            'hashCode()'
        ],

        'Long': [
            'toByte()', 'toShort()', 'toInt()', 'toLong()', 'toFloat()', 'toDouble()',
            'toChar()', 'toString()', 'toBigInteger()',
            { l: 'coerceAtLeast', t: 'coerceAtLeast(${1:minimumValue})' },
            { l: 'coerceAtMost',  t: 'coerceAtMost(${1:maximumValue})' },
            { l: 'coerceIn',      t: 'coerceIn(${1:minimumValue}, ${2:maximumValue})' },
            'inc()', 'dec()', 'unaryMinus()',
            { l: 'plus',  t: 'plus(${1:other})' },
            { l: 'minus', t: 'minus(${1:other})' },
            { l: 'times', t: 'times(${1:other})' },
            { l: 'div',   t: 'div(${1:other})' },
            { l: 'rem',   t: 'rem(${1:other})' },
            { l: 'mod',   t: 'mod(${1:other})' },
            { l: 'and',   t: 'and(${1:other})' },
            { l: 'or',    t: 'or(${1:other})' },
            { l: 'xor',   t: 'xor(${1:other})' },
            'inv()',
            { l: 'shl',  t: 'shl(${1:bitCount})' },
            { l: 'shr',  t: 'shr(${1:bitCount})' },
            { l: 'ushr', t: 'ushr(${1:bitCount})' },
            'countOneBits()', 'countLeadingZeroBits()', 'countTrailingZeroBits()',
            { l: 'rangeTo', t: 'rangeTo(${1:other})' },
            { l: 'downTo',  t: 'downTo(${1:to})' },
            { l: 'until',   t: 'until(${1:to})' },
            { l: 'step',    t: 'step(${1:step})' },
            { l: 'compareTo', t: 'compareTo(${1:other})' }
        ],

        'Double': [
            'toByte()', 'toShort()', 'toInt()', 'toLong()', 'toFloat()', 'toDouble()',
            'toString()', 'toBigDecimal()',
            { l: 'coerceAtLeast', t: 'coerceAtLeast(${1:minimumValue})' },
            { l: 'coerceAtMost',  t: 'coerceAtMost(${1:maximumValue})' },
            { l: 'coerceIn',      t: 'coerceIn(${1:minimumValue}, ${2:maximumValue})' },
            'roundToInt()', 'roundToLong()',
            { l: 'plus',  t: 'plus(${1:other})' },
            { l: 'minus', t: 'minus(${1:other})' },
            { l: 'times', t: 'times(${1:other})' },
            { l: 'div',   t: 'div(${1:other})' },
            { l: 'rem',   t: 'rem(${1:other})' },
            { l: 'mod',   t: 'mod(${1:other})' },
            'inc()', 'dec()', 'unaryMinus()',
            'isNaN()', 'isInfinite()', 'isFinite()',
            { l: 'compareTo', t: 'compareTo(${1:other})' }
        ],

        'Float': [
            'toByte()', 'toShort()', 'toInt()', 'toLong()', 'toDouble()', 'toFloat()',
            'toString()',
            { l: 'coerceAtLeast', t: 'coerceAtLeast(${1:minimumValue})' },
            { l: 'coerceAtMost',  t: 'coerceAtMost(${1:maximumValue})' },
            { l: 'coerceIn',      t: 'coerceIn(${1:minimumValue}, ${2:maximumValue})' },
            'roundToInt()', 'roundToLong()',
            { l: 'plus',  t: 'plus(${1:other})' },
            { l: 'minus', t: 'minus(${1:other})' },
            { l: 'times', t: 'times(${1:other})' },
            { l: 'div',   t: 'div(${1:other})' },
            { l: 'rem',   t: 'rem(${1:other})' },
            'inc()', 'dec()', 'unaryMinus()',
            'isNaN()', 'isInfinite()', 'isFinite()',
            { l: 'compareTo', t: 'compareTo(${1:other})' }
        ],

        'Short': [
            'toByte()', 'toShort()', 'toInt()', 'toLong()', 'toFloat()', 'toDouble()',
            'toString()',
            { l: 'coerceAtLeast', t: 'coerceAtLeast(${1:minimumValue})' },
            { l: 'coerceAtMost',  t: 'coerceAtMost(${1:maximumValue})' },
            { l: 'coerceIn',      t: 'coerceIn(${1:minimumValue}, ${2:maximumValue})' },
            { l: 'plus',  t: 'plus(${1:other})' },
            { l: 'minus', t: 'minus(${1:other})' },
            { l: 'times', t: 'times(${1:other})' },
            { l: 'div',   t: 'div(${1:other})' },
            { l: 'rem',   t: 'rem(${1:other})' },
            'inc()', 'dec()', 'unaryMinus()',
            { l: 'and', t: 'and(${1:other})' },
            { l: 'or',  t: 'or(${1:other})' },
            { l: 'xor', t: 'xor(${1:other})' },
            { l: 'shl', t: 'shl(${1:bitCount})' },
            { l: 'shr', t: 'shr(${1:bitCount})' },
            'inv()',
            { l: 'compareTo', t: 'compareTo(${1:other})' }
        ],

        'Byte': [
            'toByte()', 'toShort()', 'toInt()', 'toLong()', 'toFloat()', 'toDouble()',
            'toString()',
            { l: 'coerceAtLeast', t: 'coerceAtLeast(${1:minimumValue})' },
            { l: 'coerceAtMost',  t: 'coerceAtMost(${1:maximumValue})' },
            { l: 'coerceIn',      t: 'coerceIn(${1:minimumValue}, ${2:maximumValue})' },
            { l: 'plus',  t: 'plus(${1:other})' },
            { l: 'minus', t: 'minus(${1:other})' },
            { l: 'times', t: 'times(${1:other})' },
            { l: 'div',   t: 'div(${1:other})' },
            { l: 'rem',   t: 'rem(${1:other})' },
            'inc()', 'dec()', 'unaryMinus()',
            { l: 'and', t: 'and(${1:other})' },
            { l: 'or',  t: 'or(${1:other})' },
            { l: 'xor', t: 'xor(${1:other})' },
            'inv()',
            { l: 'compareTo', t: 'compareTo(${1:other})' }
        ],

        'Boolean': [
            { l: 'and', t: 'and(${1:other})' },
            { l: 'or',  t: 'or(${1:other})' },
            { l: 'xor', t: 'xor(${1:other})' },
            'not()',
            'toString()',
            { l: 'compareTo', t: 'compareTo(${1:other})' }
        ],

        'Char': [
            'toByte()', 'toShort()', 'toInt()', 'toLong()', 'toFloat()', 'toDouble()',
            'toChar()', 'toString()',
            'isDigit()', 'isLetter()', 'isLetterOrDigit()', 'isWhitespace()',
            'isUpperCase()', 'isLowerCase()',
            'uppercase()', 'lowercase()', 'uppercaseChar()', 'lowercaseChar()',
            'digitToInt()', 'digitToIntOrNull()',
            'code',
            { l: 'compareTo', t: 'compareTo(${1:other})' },
            'inc()', 'dec()',
            { l: 'plus',  t: 'plus(${1:other})' },
            { l: 'minus', t: 'minus(${1:other})' },
            { l: 'rangeTo', t: 'rangeTo(${1:other})' },
            { l: 'downTo',  t: 'downTo(${1:to})' },
            { l: 'until',   t: 'until(${1:to})' }
        ],

        /* ── Collections ── */
        'List': [
            'size', 'indices', 'lastIndex',
            'isEmpty()', 'isNotEmpty()',
            'first', 'last', 'firstOrNull', 'lastOrNull',
            { l: 'get',      t: 'get(${1:index})' },
            { l: 'set',      t: 'set(${1:index}, ${2:value})' },
            { l: 'add',      t: 'add(${1:value})' },
            { l: 'remove',   t: 'remove(${1:value})' },
            { l: 'addAll',   t: 'addAll(${1:collection})' },
            { l: 'contains', t: 'contains(${1:value})' },
            { l: 'indexOf',  t: 'indexOf(${1:value})' },
            { l: 'lastIndexOf', t: 'lastIndexOf(${1:value})' },
            'clear()',
            { l: 'subList', t: 'subList(${1:from}, ${2:to})' },
            { l: 'sort',    t: 'sort()' },
            { l: 'sortBy',  t: 'sortBy { ${1:it} }' },
            { l: 'sorted',  t: 'sorted()' },
            { l: 'sortedDescending',   t: 'sortedDescending()' },
            { l: 'sortedBy',           t: 'sortedBy { ${1:it} }' },
            { l: 'sortedByDescending', t: 'sortedByDescending { ${1:it} }' },
            'reversed()', 'asReversed()', 'distinct()',
            { l: 'take',     t: 'take(${1:n})' },
            { l: 'takeLast', t: 'takeLast(${1:n})' },
            { l: 'drop',     t: 'drop(${1:n})' },
            { l: 'dropLast', t: 'dropLast(${1:n})' },
            { l: 'chunked',  t: 'chunked(${1:size})' },
            { l: 'windowed', t: 'windowed(${1:size})' },
            { l: 'zip',      t: 'zip(${1:other})' },
            { l: 'map',            t: 'map { ${1:it} -> $0 }' },
            { l: 'mapIndexed',     t: 'mapIndexed { ${1:i}, ${2:it} -> $0 }' },
            { l: 'filter',         t: 'filter { ${1:it} -> $0 }' },
            { l: 'filterNot',      t: 'filterNot { ${1:it} -> $0 }' },
            { l: 'flatMap',        t: 'flatMap { ${1:it} -> $0 }' },
            { l: 'forEach',        t: 'forEach { ${1:it} -> $0 }' },
            { l: 'forEachIndexed', t: 'forEachIndexed { ${1:i}, ${2:it} -> $0 }' },
            { l: 'groupBy',        t: 'groupBy { ${1:it} }' },
            { l: 'associateBy',    t: 'associateBy { ${1:it} }' },
            { l: 'partition',      t: 'partition { ${1:it} -> $0 }' },
            { l: 'fold',           t: 'fold(${1:0}) { ${2:acc}, ${3:it} -> $0 }' },
            { l: 'reduce',         t: 'reduce { ${1:acc}, ${2:it} -> $0 }' },
            { l: 'any',   t: 'any { ${1:it} -> $0 }' },
            { l: 'all',   t: 'all { ${1:it} -> $0 }' },
            { l: 'none',  t: 'none { ${1:it} -> $0 }' },
            { l: 'find',  t: 'find { ${1:it} -> $0 }' },
            { l: 'count', t: 'count { ${1:it} -> $0 }' },
            'sum()',
            { l: 'sumOf', t: 'sumOf { ${1:it} }' },
            'minOrNull()', 'maxOrNull()',
            { l: 'binarySearch', t: 'binarySearch(${1:element})' },
            'toList()', 'toMutableList()', 'toSet()', 'toTypedArray()',
            { l: 'joinToString', t: 'joinToString(${1:\" \"})' }
        ],

        'Map': [
            'size', 'keys', 'values', 'entries',
            'isEmpty()', 'isNotEmpty()',
            { l: 'get',           t: 'get(${1:key})' },
            { l: 'put',           t: 'put(${1:key}, ${2:value})' },
            { l: 'remove',        t: 'remove(${1:key})' },
            { l: 'containsKey',   t: 'containsKey(${1:key})' },
            { l: 'containsValue', t: 'containsValue(${1:value})' },
            { l: 'getOrDefault',  t: 'getOrDefault(${1:key}, ${2:defaultValue})' },
            { l: 'getOrPut',      t: 'getOrPut(${1:key}) { ${2:defaultValue} }' },
            { l: 'putIfAbsent',   t: 'putIfAbsent(${1:key}, ${2:value})' },
            { l: 'computeIfAbsent', t: 'computeIfAbsent(${1:key}) { ${2:value} }' },
            { l: 'merge',         t: 'merge(${1:key}, ${2:value}) { ${3:old}, ${4:new} -> $0 }' },
            'clear()',
            { l: 'mapValues',  t: 'mapValues { ${1:entry} -> $0 }' },
            { l: 'mapKeys',    t: 'mapKeys { ${1:entry} -> $0 }' },
            { l: 'filterKeys', t: 'filterKeys { ${1:key} -> $0 }' },
            { l: 'filterValues', t: 'filterValues { ${1:value} -> $0 }' },
            { l: 'forEach',    t: 'forEach { (${1:k}, ${2:v}) -> $0 }' }
        ],

        'Set': [
            'size',
            'isEmpty()', 'isNotEmpty()',
            { l: 'add',      t: 'add(${1:value})' },
            { l: 'remove',   t: 'remove(${1:value})' },
            { l: 'contains', t: 'contains(${1:value})' },
            'clear()',
            { l: 'addAll', t: 'addAll(${1:collection})' },
            { l: 'map',    t: 'map { ${1:it} -> $0 }' },
            { l: 'filter', t: 'filter { ${1:it} -> $0 }' },
            { l: 'any',    t: 'any { ${1:it} -> $0 }' },
            { l: 'all',    t: 'all { ${1:it} -> $0 }' },
            { l: 'none',   t: 'none { ${1:it} -> $0 }' },
            'toSet()', 'toList()', 'toMutableSet()'
        ],

        /* ── Queues ── */
        'PriorityQueue': [
            { l: 'offer', t: 'offer(${1:value})' },
            { l: 'add',   t: 'add(${1:value})' },
            'poll()', 'peek()', 'size', 'isEmpty()', 'clear()',
            { l: 'contains', t: 'contains(${1:value})' }
        ],
        'ArrayDeque': [
            { l: 'offerFirst', t: 'offerFirst(${1:value})' },
            { l: 'offerLast',  t: 'offerLast(${1:value})' },
            { l: 'addFirst',   t: 'addFirst(${1:value})' },
            { l: 'addLast',    t: 'addLast(${1:value})' },
            'pollFirst()', 'pollLast()',
            'peekFirst()', 'peekLast()',
            'removeFirst()', 'removeLast()',
            'getFirst()', 'getLast()',
            { l: 'push', t: 'push(${1:value})' },
            'pop()',
            'size', 'isEmpty()', 'clear()',
            { l: 'contains', t: 'contains(${1:value})' }
        ],

        /* ── Java arrays ── */
        'int[]':     ['length', 'clone()'],
        'long[]':    ['length', 'clone()'],
        'double[]':  ['length', 'clone()'],
        'float[]':   ['length', 'clone()'],
        'char[]':    ['length', 'clone()'],
        'boolean[]': ['length', 'clone()'],
        'String[]':  ['length', 'clone()'],
        'Object[]':  ['length', 'clone()'],

        /* ── Kotlin arrays ── */
        'IntArray': [
            'size', 'indices', 'lastIndex',
            'isEmpty()', 'isNotEmpty()',
            { l: 'get', t: 'get(${1:index})' },
            { l: 'set', t: 'set(${1:index}, ${2:value})' },
            'sort()', 'sortDescending()',
            'sorted()', 'sortedDescending()',
            { l: 'sortedBy',           t: 'sortedBy { ${1:it} }' },
            { l: 'sortedByDescending', t: 'sortedByDescending { ${1:it} }' },
            'reversed()', 'asReversed()', 'distinct()',
            { l: 'map',            t: 'map { ${1:it} -> $0 }' },
            { l: 'mapIndexed',     t: 'mapIndexed { ${1:i}, ${2:it} -> $0 }' },
            { l: 'filter',         t: 'filter { ${1:it} -> $0 }' },
            { l: 'filterNot',      t: 'filterNot { ${1:it} -> $0 }' },
            { l: 'forEach',        t: 'forEach { ${1:it} -> $0 }' },
            { l: 'forEachIndexed', t: 'forEachIndexed { ${1:i}, ${2:it} -> $0 }' },
            { l: 'any',   t: 'any { ${1:it} -> $0 }' },
            { l: 'all',   t: 'all { ${1:it} -> $0 }' },
            { l: 'none',  t: 'none { ${1:it} -> $0 }' },
            { l: 'find',  t: 'find { ${1:it} -> $0 }' },
            { l: 'count', t: 'count { ${1:it} -> $0 }' },
            'sum()',
            { l: 'sumOf', t: 'sumOf { ${1:it} }' },
            'minOrNull()', 'maxOrNull()', 'average()',
            { l: 'reduce', t: 'reduce { ${1:acc}, ${2:it} -> $0 }' },
            { l: 'fold',   t: 'fold(${1:0}) { ${2:acc}, ${3:it} -> $0 }' },
            { l: 'take',     t: 'take(${1:n})' },
            { l: 'takeLast', t: 'takeLast(${1:n})' },
            { l: 'drop',     t: 'drop(${1:n})' },
            { l: 'dropLast', t: 'dropLast(${1:n})' },
            { l: 'slice',    t: 'slice(${1:range})' },
            { l: 'contains', t: 'contains(${1:value})' },
            { l: 'indexOf',     t: 'indexOf(${1:value})' },
            { l: 'lastIndexOf', t: 'lastIndexOf(${1:value})' },
            { l: 'binarySearch', t: 'binarySearch(${1:value})' },
            { l: 'fill', t: 'fill(${1:value})' },
            { l: 'copyOf',      t: 'copyOf(${1:newSize})' },
            { l: 'copyOfRange', t: 'copyOfRange(${1:from}, ${2:to})' },
            { l: 'copyInto',    t: 'copyInto(${1:destination})' },
            'toList()', 'toMutableList()', 'toSet()', 'toTypedArray()',
            'asList()', 'asIterable()', 'asSequence()',
            { l: 'joinToString', t: 'joinToString(${1:\" \"})' },
            'contentToString()', 'contentEquals()', 'contentHashCode()',
            'random()', 'shuffled()', 'withIndex()'
        ],

        'LongArray': [
            'size', 'indices', 'lastIndex', 'isEmpty()', 'isNotEmpty()',
            { l: 'get', t: 'get(${1:index})' },
            { l: 'set', t: 'set(${1:index}, ${2:value})' },
            'sort()', 'sortDescending()', 'sorted()', 'sortedDescending()',
            'reversed()', 'asReversed()', 'distinct()',
            { l: 'map',    t: 'map { ${1:it} -> $0 }' },
            { l: 'filter', t: 'filter { ${1:it} -> $0 }' },
            { l: 'forEach',t: 'forEach { ${1:it} -> $0 }' },
            { l: 'any',    t: 'any { ${1:it} -> $0 }' },
            { l: 'all',    t: 'all { ${1:it} -> $0 }' },
            { l: 'none',   t: 'none { ${1:it} -> $0 }' },
            { l: 'find',   t: 'find { ${1:it} -> $0 }' },
            { l: 'count',  t: 'count { ${1:it} -> $0 }' },
            'sum()',
            { l: 'sumOf', t: 'sumOf { ${1:it} }' },
            'minOrNull()', 'maxOrNull()', 'average()',
            { l: 'take', t: 'take(${1:n})' },
            { l: 'drop', t: 'drop(${1:n})' },
            { l: 'contains', t: 'contains(${1:value})' },
            { l: 'indexOf',  t: 'indexOf(${1:value})' },
            { l: 'binarySearch', t: 'binarySearch(${1:value})' },
            { l: 'fill', t: 'fill(${1:value})' },
            { l: 'copyOf', t: 'copyOf(${1:newSize})' },
            'toList()', 'toMutableList()', 'toSet()', 'toTypedArray()',
            { l: 'joinToString', t: 'joinToString(${1:\" \"})' },
            'contentToString()', 'contentEquals()', 'contentHashCode()',
            'random()', 'shuffled()'
        ],

        'DoubleArray': [
            'size', 'indices', 'lastIndex', 'isEmpty()', 'isNotEmpty()',
            { l: 'get', t: 'get(${1:index})' },
            { l: 'set', t: 'set(${1:index}, ${2:value})' },
            'sort()', 'sortDescending()', 'sorted()', 'sortedDescending()',
            'reversed()', 'distinct()',
            { l: 'map',    t: 'map { ${1:it} -> $0 }' },
            { l: 'filter', t: 'filter { ${1:it} -> $0 }' },
            { l: 'forEach',t: 'forEach { ${1:it} -> $0 }' },
            { l: 'any',    t: 'any { ${1:it} -> $0 }' },
            { l: 'all',    t: 'all { ${1:it} -> $0 }' },
            { l: 'none',   t: 'none { ${1:it} -> $0 }' },
            { l: 'count',  t: 'count { ${1:it} -> $0 }' },
            'sum()',
            { l: 'sumOf', t: 'sumOf { ${1:it} }' },
            'minOrNull()', 'maxOrNull()', 'average()',
            { l: 'contains', t: 'contains(${1:value})' },
            { l: 'indexOf',  t: 'indexOf(${1:value})' },
            { l: 'binarySearch', t: 'binarySearch(${1:value})' },
            { l: 'fill', t: 'fill(${1:value})' },
            { l: 'copyOf', t: 'copyOf(${1:newSize})' },
            'toList()', 'toMutableList()',
            { l: 'joinToString', t: 'joinToString(${1:\" \"})' },
            'contentToString()', 'random()', 'shuffled()'
        ],

        'BooleanArray': [
            'size', 'indices', 'lastIndex', 'isEmpty()', 'isNotEmpty()',
            { l: 'get', t: 'get(${1:index})' },
            { l: 'set', t: 'set(${1:index}, ${2:value})' },
            { l: 'forEach',t: 'forEach { ${1:it} -> $0 }' },
            { l: 'filter', t: 'filter { ${1:it} -> $0 }' },
            { l: 'count',  t: 'count { ${1:it} -> $0 }' },
            { l: 'any',    t: 'any { ${1:it} -> $0 }' },
            { l: 'all',    t: 'all { ${1:it} -> $0 }' },
            { l: 'none',   t: 'none { ${1:it} -> $0 }' },
            { l: 'contains', t: 'contains(${1:value})' },
            { l: 'copyOf', t: 'copyOf(${1:newSize})' },
            { l: 'joinToString', t: 'joinToString(${1:\" \"})' },
            'toList()', 'contentToString()'
        ],

        'CharArray': [
            'size', 'indices', 'lastIndex', 'isEmpty()', 'isNotEmpty()',
            { l: 'get', t: 'get(${1:index})' },
            { l: 'set', t: 'set(${1:index}, ${2:value})' },
            'sort()', 'sorted()', 'sortedDescending()', 'reversed()',
            { l: 'joinToString', t: 'joinToString(${1:\"\"})' },
            'concatToString()',
            { l: 'forEach',t: 'forEach { ${1:it} -> $0 }' },
            { l: 'filter', t: 'filter { ${1:it} -> $0 }' },
            { l: 'contains', t: 'contains(${1:char})' },
            { l: 'indexOf',  t: 'indexOf(${1:char})' },
            'toList()', 'toMutableList()', 'contentToString()'
        ],

        'Array': [
            'size', 'indices', 'lastIndex', 'isEmpty()', 'isNotEmpty()',
            { l: 'get', t: 'get(${1:index})' },
            { l: 'set', t: 'set(${1:index}, ${2:value})' },
            'sort()',
            { l: 'sorted',  t: 'sorted()' },
            { l: 'sortedBy',t: 'sortedBy { ${1:it} }' },
            { l: 'sortedByDescending', t: 'sortedByDescending { ${1:it} }' },
            { l: 'sortedDescending',   t: 'sortedDescending()' },
            'reversed()', 'distinct()',
            { l: 'map',    t: 'map { ${1:it} -> $0 }' },
            { l: 'filter', t: 'filter { ${1:it} -> $0 }' },
            { l: 'forEach',t: 'forEach { ${1:it} -> $0 }' },
            { l: 'any',    t: 'any { ${1:it} -> $0 }' },
            { l: 'all',    t: 'all { ${1:it} -> $0 }' },
            { l: 'none',   t: 'none { ${1:it} -> $0 }' },
            { l: 'find',   t: 'find { ${1:it} -> $0 }' },
            { l: 'count',  t: 'count { ${1:it} -> $0 }' },
            { l: 'sumOf',  t: 'sumOf { ${1:it} }' },
            'minOrNull()', 'maxOrNull()',
            { l: 'contains', t: 'contains(${1:value})' },
            { l: 'indexOf',  t: 'indexOf(${1:value})' },
            { l: 'binarySearch', t: 'binarySearch(${1:value})' },
            { l: 'copyOf', t: 'copyOf(${1:newSize})' },
            'toList()', 'toMutableList()',
            { l: 'joinToString', t: 'joinToString(${1:\" \"})' },
            'contentToString()', 'contentEquals()', 'sortedArray()'
        ],

        /* ── Misc ── */
        'Pair':   ['first', 'second', 'toList()', 'toString()'],
        'Triple': ['first', 'second', 'third', 'toList()', 'toString()'],

        'Scanner': [
            'nextInt()', 'nextLong()', 'nextDouble()', 'next()', 'nextLine()',
            'hasNext()', 'hasNextInt()', 'hasNextLong()', 'hasNextDouble()', 'close()'
        ],
        'BufferedReader': ['readLine()', 'read()', 'close()', 'ready()'],
        'StringTokenizer': ['nextToken()', 'hasMoreTokens()', 'countTokens()'],

        'Math': [
            { l: 'abs',   t: 'abs(${1:x})' },
            { l: 'min',   t: 'min(${1:a}, ${2:b})' },
            { l: 'max',   t: 'max(${1:a}, ${2:b})' },
            { l: 'pow',   t: 'pow(${1:a}, ${2:b})' },
            { l: 'sqrt',  t: 'sqrt(${1:x})' },
            { l: 'floor', t: 'floor(${1:x})' },
            { l: 'ceil',  t: 'ceil(${1:x})' },
            { l: 'round', t: 'round(${1:x})' },
            { l: 'log',   t: 'log(${1:x})' },
            { l: 'exp',   t: 'exp(${1:x})' },
            { l: 'sin',   t: 'sin(${1:x})' },
            { l: 'cos',   t: 'cos(${1:x})' },
            { l: 'tan',   t: 'tan(${1:x})' },
            'random()'
        ],
        'Arrays': [
            { l: 'sort',   t: 'sort(${1:arr})' },
            { l: 'fill',   t: 'fill(${1:arr}, ${2:value})' },
            { l: 'toString', t: 'toString(${1:arr})' },
            { l: 'asList', t: 'asList(${1:arr})' },
            { l: 'binarySearch', t: 'binarySearch(${1:arr}, ${2:key})' },
            { l: 'copyOf', t: 'copyOf(${1:arr}, ${2:newLength})' },
            { l: 'copyOfRange', t: 'copyOfRange(${1:arr}, ${2:from}, ${3:to})' },
            { l: 'equals', t: 'equals(${1:a}, ${2:b})' },
            { l: 'deepToString', t: 'deepToString(${1:arr})' }
        ],
        'Collections': [
            { l: 'sort',      t: 'sort(${1:list})' },
            { l: 'reverse',   t: 'reverse(${1:list})' },
            { l: 'shuffle',   t: 'shuffle(${1:list})' },
            { l: 'max',       t: 'max(${1:collection})' },
            { l: 'min',       t: 'min(${1:collection})' },
            { l: 'frequency', t: 'frequency(${1:collection}, ${2:element})' },
            { l: 'swap',      t: 'swap(${1:list}, ${2:i}, ${3:j})' },
            { l: 'nCopies',   t: 'nCopies(${1:n}, ${2:element})' }
        ],

        'Integer': [
            { l: 'parseInt', t: 'parseInt(${1:s})' },
            { l: 'valueOf',  t: 'valueOf(${1:i})' },
            { l: 'compare',  t: 'compare(${1:a}, ${2:b})' },
            { l: 'max',      t: 'max(${1:a}, ${2:b})' },
            { l: 'min',      t: 'min(${1:a}, ${2:b})' },
            { l: 'bitCount', t: 'bitCount(${1:i})' },
            { l: 'toBinaryString', t: 'toBinaryString(${1:i})' },
            { l: 'toHexString',    t: 'toHexString(${1:i})' }
        ],
        'Long': [
            { l: 'parseLong', t: 'parseLong(${1:s})' },
            { l: 'valueOf',   t: 'valueOf(${1:i})' },
            { l: 'compare',   t: 'compare(${1:a}, ${2:b})' },
            { l: 'bitCount',  t: 'bitCount(${1:i})' }
        ],
        'Character': [
            { l: 'isDigit',          t: 'isDigit(${1:c})' },
            { l: 'isLetter',         t: 'isLetter(${1:c})' },
            { l: 'isLetterOrDigit',  t: 'isLetterOrDigit(${1:c})' },
            { l: 'isWhitespace',     t: 'isWhitespace(${1:c})' },
            { l: 'isUpperCase',      t: 'isUpperCase(${1:c})' },
            { l: 'isLowerCase',      t: 'isLowerCase(${1:c})' },
            { l: 'toLowerCase',      t: 'toLowerCase(${1:c})' },
            { l: 'toUpperCase',      t: 'toUpperCase(${1:c})' },
            { l: 'getNumericValue',  t: 'getNumericValue(${1:c})' }
        ],
        'BigInteger': [
            { l: 'add',      t: 'add(${1:other})' },
            { l: 'subtract', t: 'subtract(${1:other})' },
            { l: 'multiply', t: 'multiply(${1:other})' },
            { l: 'divide',   t: 'divide(${1:other})' },
            { l: 'mod',      t: 'mod(${1:m})' },
            { l: 'pow',      t: 'pow(${1:exponent})' },
            { l: 'gcd',      t: 'gcd(${1:other})' },
            { l: 'abs',      t: 'abs()' },
            { l: 'negate',   t: 'negate()' },
            { l: 'modPow',   t: 'modPow(${1:exponent}, ${2:m})' },
            { l: 'modInverse', t: 'modInverse(${1:m})' },
            { l: 'compareTo', t: 'compareTo(${1:other})' }
        ],
        'BigDecimal': [
            { l: 'add',      t: 'add(${1:other})' },
            { l: 'subtract', t: 'subtract(${1:other})' },
            { l: 'multiply', t: 'multiply(${1:other})' },
            { l: 'divide',   t: 'divide(${1:other})' },
            { l: 'compareTo', t: 'compareTo(${1:other})' },
            { l: 'abs',      t: 'abs()' },
            { l: 'negate',   t: 'negate()' },
            { l: 'setScale', t: 'setScale(${1:scale})' }
        ]
    };

    /* ═══════════════════════════════════════════════════════════════════
     * 6. Completion provider
     * ═══════════════════════════════════════════════════════════════════ */

    const KIND_MAP = {
        Class: K.Class,
        Method: K.Method,
        Function: K.Function,
        Field: K.Field,
        Property: K.Property,
        Variable: K.Variable
    };

    /* Normalize a METHODS entry to a full suggestion object */
    function methodSuggestion(m, range, detail) {
        if (typeof m === 'string') {
            const label = m.endsWith('()') ? m.slice(0, -2) : m;
            return {
                label,
                kind: K.Method,
                detail,
                insertText: m,
                range,
                sortText: '1_' + label
            };
        }
        const isSnippet = /\$\{/.test(m.t);
        const s = {
            label: m.l,
            kind: K.Method,
            detail: m.d || detail,
            insertText: m.t,
            range,
            sortText: '1_' + m.l
        };
        if (isSnippet) s.insertTextRules = R.InsertAsSnippet;
        return s;
    }

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

            const line = model.getLineContent(position.lineNumber);
            const textBefore = line.substring(0, position.column - 1);
            const lastDot = textBefore.lastIndexOf('.');
            const isAfterDot =
                lastDot >= 0 &&
                /^\w*$/.test(textBefore.substring(lastDot + 1));

            if (isAfterDot) {
                const beforeLastDot = textBefore.substring(0, lastDot);
                const m = beforeLastDot.match(/([a-zA-Z_$][\w$]*)$/);
                const varName = m ? m[1] : null;

                if (varName) {
                    const typeMap = getTypeMap(model);
                    const declared = typeMap.get(varName);
                    const normalized = normalizeType(declared);
                    const methods = normalized ? METHODS[normalized] : null;

                    if (methods && methods.length) {
                        return {
                            suggestions: methods.map(x => methodSuggestion(x, range, normalized))
                        };
                    }
                }

                return {
                    suggestions: getIdentifiers(model).map(id => ({
                        label: id.name,
                        kind: KIND_MAP[id.kind] ?? K.Text,
                        insertText: id.name,
                        range,
                        sortText: '2_' + id.name
                    }))
                };
            }

            const suggestions = [];

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

            getIdentifiers(model).forEach(id => suggestions.push({
                label: id.name,
                kind: KIND_MAP[id.kind] ?? K.Text,
                insertText: id.name,
                range,
                sortText: '2_' + id.name
            }));

            (TYPES[lang] || []).forEach(t => suggestions.push({
                label: t,
                kind: K.Class,
                detail: 'type',
                insertText: t,
                range,
                sortText: '3_' + t
            }));

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
     * 7. Editor options + hotkeys
     * ═══════════════════════════════════════════════════════════════════ */

    editor.updateOptions({
        /* ── Suggestions ── */
        quickSuggestions: { other: true, comments: false, strings: false },
        suggestOnTriggerCharacters: true,
        tabCompletion: 'on',
        acceptSuggestionOnEnter: 'smart',
        snippetSuggestions: 'top',
        wordBasedSuggestions: 'off',            // disable built-in word suggestions (we provide our own)
        quickSuggestionsDelay: 10,
        snippetsPreventQuickSuggestions: false,

        suggest: {
            preview: true,
            showStatusBar: true,
            showKeywords: true,
            showSnippets: true,
            showWords: false,                   // our identifier extractor replaces it
            showClasses: true,
            showMethods: true,
            showFunctions: true,
            showVariables: true,
            showFields: true,
            showProperties: true
        },

        parameterHints: { enabled: true },

        /* ── Editing ── */
        tabSize: 4,
        insertSpaces: true,
        autoClosingBrackets: 'languageDefined',
        autoClosingQuotes: 'languageDefined',
        autoSurround: 'languageDefined',
        formatOnPaste: true,
        formatOnType: true,
        wordWrap: 'on',
        wrappingIndent: 'indent',

        /* ── Performance ── */
        minimap: { enabled: false },
        scrollBeyondLastLine: false,

        /* ── Visual noise reduction ── */
        links: false,
        colorDecorators: false,
        lightbulb: { enabled: 'off' },
        codeLens: false,
        occurrencesHighlight: 'singleFile'
    });

    /* ── Hotkeys ── */
    // Ctrl+Space / Cmd+Space — force open the suggestion widget
    editor.addCommand(M.KeyMod.CtrlCmd | M.KeyCode.Space, () => {
        editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });

    // Ctrl+G — go to line
    editor.addCommand(M.KeyMod.CtrlCmd | M.KeyCode.KeyG, () => {
        editor.trigger('keyboard', 'editor.action.gotoLine', {});
    });

    // Ctrl+/ — toggle line comment
    editor.addCommand(M.KeyMod.CtrlCmd | M.KeyCode.US_SLASH, () => {
        editor.trigger('keyboard', 'editor.action.commentLine', {});
    });

    // Ctrl+. — quick fix (code actions)
    editor.addCommand(M.KeyMod.CtrlCmd | M.KeyCode.US_DOT, () => {
        editor.trigger('keyboard', 'editor.action.quickFix', {});
    });

    console.log('%c✅ Autocomplete activated',
        'color:#4caf50;font-weight:bold');
})();
