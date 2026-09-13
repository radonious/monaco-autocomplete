(function () {
  'use strict';

  /* ─────────────── 1. Получаем Monaco и активный редактор ─────────────── */
  const M = window.monaco;
  if (!M || !M.editor) return alert('Monaco Editor не найден на странице.');

  const editors = M.editor.getEditors();
  if (!editors || editors.length === 0) return alert('Открытых редакторов нет.');

  // Берём редактор в фокусе, иначе — первый
  const editor = editors.find(e => e.hasTextFocus && e.hasTextFocus()) || editors[0];
  const model  = editor.getModel();
  if (!model) return;

  /* ─────────────── 2. Ключевые слова по языкам ─────────────── */
  const KEYWORDS = {
    java: [
      'public','private','protected','class','interface','enum','record','extends','implements',
      'void','int','long','double','float','boolean','char','byte','short','String','var',
      'if','else','switch','case','default','for','while','do','break','continue','return',
      'new','import','package','this','super','static','final','abstract','synchronized','volatile',
      'try','catch','finally','throw','throws','instanceof','null','true','false','yield'
    ],
    kotlin: [
      'fun','val','var','class','interface','object','data','sealed','enum','annotation',
      'if','else','when','for','while','do','break','continue','return','is','in','as','as?',
      'try','catch','finally','throw','null','true','false','this','super','package','import',
      'private','public','protected','internal','open','override','abstract','final','const',
      'lateinit','companion','init','constructor','suspend','inline','reified','operator','infix',
      'by','where','out','vararg','typealias'
    ]
  };

  /* ─────────────── 3. Сниппеты по языкам ─────────────── */
  const SNIPPETS = {
    java: [
      { l:'psvm',  d:'main-метод (Java)',  t:'public static void main(String[] args) {\n\t$0\n}' },
      { l:'sout',  d:'System.out.println', t:'System.out.println(${1:value});' },
      { l:'souf',  d:'printf',             t:'System.out.printf("${1:%s}\\n", ${2:value});' },
      { l:'fori',  d:'Цикл for',           t:'for (int ${1:i} = 0; $1 < ${2:n}; $1++) {\n\t$0\n}' },
      { l:'foreach', d:'for-each',         t:'for (${1:Type} ${2:item} : ${3:collection}) {\n\t$0\n}' },
      { l:'tryc',  d:'try/catch',          t:'try {\n\t$0\n} catch (${1:Exception} e) {\n\te.printStackTrace();\n}' },
      { l:'hashmap', d:'HashMap',          t:'Map<${1:K}, ${2:V}> ${3:map} = new HashMap<>();' },
      { l:'arraylist', d:'ArrayList',      t:'List<${1:T}> ${2:list} = new ArrayList<>();' },
      { l:'hashset', d:'HashSet',          t:'Set<${1:T}> ${2:set} = new HashSet<>();' },
      { l:'optional', d:'Optional',        t:'Optional.ofNullable(${1:value}).ifPresent(${2:v} -> $0);' },
      { l:'stream', d:'Stream pipeline',   t:'${1:list}.stream()\n\t.filter(${2:x} -> ${3:cond})\n\t.map(${4:x} -> ${5:result})\n\t.collect(Collectors.toList());' },
      { l:'ifnull', d:'null-check',        t:'if (${1:obj} != null) {\n\t$0\n}' },
      { l:'class',  d:'Класс',             t:'public class ${1:Name} {\n\tpublic ${1:Name}(${2:args}) {\n\t\t$0\n\t}\n}' }
    ],
    kotlin: [
      { l:'main',  d:'fun main()',         t:'fun main() {\n\t$0\n}' },
      { l:'fun',   d:'Объявление функции', t:'fun ${1:name}(${2:args}): ${3:Unit} {\n\t$0\n}' },
      { l:'println', d:'println',          t:'println(${1:value})' },
      { l:'val',   d:'val',                t:'val ${1:name} = ${2:value}' },
      { l:'var',   d:'var',                t:'var ${1:name} = ${2:value}' },
      { l:'listOf',  d:'listOf',           t:'val ${1:list} = listOf(${2:items})' },
      { l:'mutableListOf', d:'mutableListOf', t:'val ${1:list} = mutableListOf<${2:T}>()' },
      { l:'mapOf',   d:'mapOf',            t:'val ${1:map} = mapOf(${2:k} to ${3:v})' },
      { l:'mutableMapOf', d:'mutableMapOf',t:'val ${1:map} = mutableMapOf<${2:K}, ${3:V}>()' },
      { l:'fori',  d:'for по индексу',     t:'for (${1:i} in 0 until ${2:n}) {\n\t$0\n}' },
      { l:'forin', d:'for по коллекции',   t:'for (${1:item} in ${2:collection}) {\n\t$0\n}' },
      { l:'when',  d:'when-выражение',     t:'when (${1:value}) {\n\t${2:cond} -> $0\n\telse -> {}\n}' },
      { l:'ifnull',d:'Elvis / null-safety',t:'${1:value} ?: ${2:defaultValue}' },
      { l:'tryc',  d:'try/catch',          t:'try {\n\t$0\n} catch (e: Exception) {\n\te.printStackTrace()\n}' },
      { l:'dclass',d:'data class',         t:'data class ${1:Name}(\n\tval ${2:prop}: ${3:Type}\n)' },
      { l:'object',d:'object Singleton',   t:'object ${1:Singleton} {\n\t$0\n}' },
      { l:'comp',  d:'companion object',   t:'companion object {\n\t$0\n}' },
      { l:'let',   d:'let',                t:'${1:value}.let { ${2:it} ->\n\t$0\n}' },
      { l:'apply', d:'apply',              t:'${1:value}.apply {\n\t$0\n}' },
      { l:'also',  d:'also',               t:'${1:value}.also { ${2:it} ->\n\t$0\n}' },
      { l:'launch',d:'coroutine launch',   t:'CoroutineScope(Dispatchers.IO).launch {\n\t$0\n}' },
      { l:'sfun',  d:'suspend fun',        t:'suspend fun ${1:name}(): ${2:Unit} {\n\t$0\n}' }
    ]
  };

  /* ─────────────── 4. Убираем предыдущие регистрации (антидубликат) ─────────────── */
  if (Array.isArray(window.__acDisposables)) {
    window.__acDisposables.forEach(d => { try { d.dispose(); } catch (_) {} });
  }
  window.__acDisposables = [];

  /* ─────────────── 5. Провайдер подсказок ─────────────── */
  const makeProvider = (lang) => {
    const kws = KEYWORDS[lang] || [];
    const snips = SNIPPETS[lang] || [];
    if (kws.length === 0 && snips.length === 0) return null;

    return M.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: ['.', ':', '<', '@'],

      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber:   position.lineNumber,
          startColumn:     word.startColumn,
          endColumn:       word.endColumn
        };

        const suggestions = [];

        // Ключевые слова
        kws.forEach(kw => suggestions.push({
          label: kw,
          kind: M.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
          sortText: '2_' + kw          // ключевые слова ниже сниппетов
        }));

        // Сниппеты
        snips.forEach(s => suggestions.push({
          label: s.l,
          kind: M.languages.CompletionItemKind.Snippet,
          detail: 'snippet',
          documentation: { value: '```' + lang + '\n' + s.t + '\n```' },
          insertText: s.t,
          insertTextRules: M.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          sortText: '1_' + s.l          // сниппеты выше
        }));

        return { suggestions };
      }
    });
  };

  // Регистрируем для Java и Kotlin (провайдер сам поймёт, какой язык активен)
  ['java', 'kotlin'].forEach(lang => {
    const d = makeProvider(lang);
    if (d) window.__acDisposables.push(d);
  });

  /* ─────────────── 6. Опции редактора ─────────────── */
  editor.updateOptions({
    quickSuggestions: { other: true, comments: false, strings: false },
    suggestOnTriggerCharacters: true,
    tabCompletion: 'on',              // Tab принимает подсказку из виджета
    acceptSuggestionOnEnter: 'smart',
    wordBasedSuggestions: true,       // подсказки из текста файла
    snippetSuggestions: 'top',
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showWords: true
    }
  });

  /* ─────────────── 7. Горячие клавиши ─────────────── */

  // Ctrl+Space / Cmd+Space — принудительно показать автокомплит
  editor.addCommand(M.KeyMod.CtrlCmd | M.KeyCode.Space, () => {
    editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
  });

  // Tab — если виджет ещё не открыт и нет выделения, показать подсказки.
  // Когда виджет открыт — Tab работает штатно (принимает подсказку).
  //editor.addCommand(
  //  M.KeyCode.Tab,
  //  () => editor.trigger('keyboard', 'editor.action.triggerSuggest', {}),
  //  'editorTextFocus && !suggestWidgetVisible && !editorHasSelection ' +
  //  '&& !editorHasMultipleSelections && !editorTabMovesFocus && !inSnippetMode'
  //);

  console.log('%c✅ Автокомплит активирован для', 'color:#4caf50', model.getLanguageId());
})();
