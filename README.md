# monaco-autocomplete
PET. Enable autocomplete for monaco-editor

# Usage
1. Create browser page bookmark
2. Put code below as URL
```
javascript:(function(){
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/gh/radonious/monaco-autocomplete@main/monaco-autocomplete.js?t='+Date.now();
  document.body.appendChild(s);
})();
```
