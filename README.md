# Monaco Autocomplete

Bookmarklet that adds autocomplete to Monaco Editor on web-based coding platforms (LeetCode, Codeforces, etc.).

Provides snippet suggestions, standard types, keywords, and in-document identifier extraction for **Java** and **Kotlin**.

## Features

- **Snippets** — input/output, data structures, arrays, loops, common patterns
- **Standard types** — boxed primitives, collections, I/O classes
- **Keywords** — language keywords for Java and Kotlin
- **In-document identifiers** — auto-extracted classes, methods, fields, variables with proper icons
- **Type-aware suggestions** — after `arr.` you get only array methods
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
3. Builds a type map from declarations in the current document.
4. Updates editor options and binds hotkeys.

Re-running the bookmarklet disposes previous providers via `window.__acDisposables` to prevent duplicates.

## Configuration

All data lives in the single `monaco-autocomplete.js` file, organized into numbered sections:

| Section | Content |
|---------|---------|
| 1 | Keywords |
| 2 | Snippets |
| 3 | Standard types |
| 4 | Identifier extraction + type map |
| 5 | Method table |
| 6 | Completion provider |
| 7 | Editor options and hotkeys |
| 8 | Entry point |

To customize, fork the repo, edit the arrays in sections 1–5, and update the bookmarklet URL with your GitHub username.

## Tools

### Purge jsDelivr cache

After pushing changes to GitHub, the CDN may keep serving the old version for some time. To force an update, use the official purge tool:

- **Web UI:** https://www.jsdelivr.com/tools/purge — paste the full URL and click «Purge».
- **API:** send a `POST` request to `https://purge.jsdelivr.net` with the file path.

Alternatively, a GitHub Action can purge the cache automatically on every push to `main`.

### Build a bookmarklet from source

If you want to rebuild the bookmarklet URL from the raw script (for example, after changing the CDN or repository), use the online Bookmarklet Maker:

- https://caiorss.github.io/bookmarklet-maker/

Paste the script content, generate the encoded `javascript:...` URL, and save it as a bookmark.

## Limitations

- Chained calls (`list.get(0).`) fall back to identifier suggestions — the type is not inferred.
- Custom classes only expose members declared in the current document.
- Static access (`Math.`, `Arrays.`) requires the name to be present in the type map (i.e. assigned to a variable).
- Cross-file type inference is not supported.

## License

MIT
