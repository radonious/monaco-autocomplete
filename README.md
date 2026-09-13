# Monaco Autocomplete

Bookmarklet that adds autocomplete to Monaco Editor on web-based coding platforms (LeetCode, Codeforces, etc.).

Provides snippet suggestions, standard types, keywords, and in-document identifier extraction for **Java** and **Kotlin**.

## Features

- **Snippets** — input/output, data structures, arrays, loops, common patterns
- **Standard types** — boxed primitives, collections, I/O classes
- **Keywords** — language keywords for Java and Kotlin
- **In-document identifiers** — auto-extracted classes, methods, fields, variables with proper icons
- **Hotkeys** — `Ctrl+Space` to trigger suggestions, `Tab` to accept

## Usage

1. Copy the bookmarklet below:
```
javascript:(function(){
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/gh/radonious/monaco-autocomplete@main/monaco-autocomplete.js?t='+Date.now();
  document.body.appendChild(s);
})();
```
2. Create a new bookmark in your browser.
3. Paste the code into the URL field.
4. Open a page with Monaco Editor and click the bookmark.

## How it works

The bookmarklet injects `monaco-autocomplete.js` via jsDelivr CDN. The script:

1. Locates the active Monaco editor.
2. Registers `CompletionItemProvider`s for `java` and `kotlin`.
3. Updates editor options and binds hotkeys.

Re-running the bookmarklet disposes previous providers via `window.__acDisposables` to prevent duplicates.

## Configuration

All data lives in the single `monaco-autocomplete.js` file, organized into numbered sections:

| Section | Content |
|---------|---------|
| 1 | Keywords |
| 2 | Snippets |
| 3 | Standard types |
| 4 | Identifier extraction |
| 5 | Completion provider |
| 6 | Editor options and hotkeys |
| 7 | Entry point |

To customize, fork the repo, edit the arrays in sections 1–3, and update the bookmarklet URL with your GitHub username.

## License

MIT
