// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../xml/xml"), require("../meta"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../xml/xml", "../meta"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("udon", function(cmCfg, modeCfg) {

  // Should characters that affect highlighting be highlighted separate?
  // Does not include characters that will be output (such as `1.` and `-` for lists)
  // Add `.cm-s-default .cm-formatting {color: pink;}` to codemirror.css
  // (or wherever) to see this if modeCfg.highlightFormatting is set to true.
  if (modeCfg.highlightFormatting === undefined)
    modeCfg.highlightFormatting = false;

  // Allow token types to be overridden by user-provided token types.
  if (modeCfg.tokenTypeOverrides === undefined)
    modeCfg.tokenTypeOverrides = {};

  var tokenTypes = {
    header: "header",
    code: "comment",
    quote: "quote",
    list1: "variable-2",
    list2: "variable-3",
    list3: "keyword",
    hr: "hr",
    image: "image",
    imageAltText: "image-alt-text",
    imageMarker: "image-marker",
    formatting: "formatting",
    linkText: "link",
    linkHref: "string",
    em: "em",
    strong: "strong",
    string: "string", // udon
    sail: "keyword", // udon
    poem: "def", // udon
    error: "error" // udon
  };

  for (var tokenType in tokenTypes) {
    if (tokenTypes.hasOwnProperty(tokenType) && modeCfg.tokenTypeOverrides[tokenType]) {
      tokenTypes[tokenType] = modeCfg.tokenTypeOverrides[tokenType];
    }
  }

  var
      // changed - don't use * or _ as horizontal rule
//    hrRE = /^([*\-_])(?:\s*\1){2,}\s*$/ // markdown
      hrRE = /^\-\-\-+(.*)$/              // udon - match more than ---
      //
      // changed - don't use * or 1. as list item
//,   listRE = /^(?:[*\-+]|^[0-9]+([.)]))\s+/ // markdown
  ,   listRE = /^([\-+]) \n?/                 // udon - capture the hep or lus
      //
      // changed - require at least one space to be a header, and hax newline is not a header
//,   atxHeaderRE = modeCfg.allowAtxHeaderWithoutSpace ? /^(#+)/ : /^(#+)(?: |$)/ // markdown
//,   atxHeaderRE = /^(#+)(?: (?! ))/                                             // udon - only one space
  ,   atxHeaderRE = /^(#+)(?: )/                                                  // udon - at least one space
      //
      // udon - hoon arm - ++arm:core
      // try matching this before textRE so that
      // arm++arm:core doesn't appear to partially match
      // (XX - actually, we want "partial" match - fix me)
  ,   armRE = /^\+[\+\-\$\*](?:(?:[a-z]+\-*)+\:*)+(?: |$)/
      //
      // udon - hoon constant - ~2017.8.29
      // try matching this before textRE so that
      // date~2017.8.29 doesn't appear to partially match
      // XX - probably doesn't match udon parser exactly - fix me
  ,   dateRE = /^~\d+\.\d+\.\d+(?: |$)/
      //
      // udon - hoon constant - 0xdead.beef
      // try matching this before textRE so that
      // hex0xdead.beef doesn't appear to partially match
      // XX - probably doesn't match udon parser exactly - fix me
  ,   hexRE = /^0x[0-9a-z]+(?:\.[0-9a-z]+)*(?: |$)/
      //
      // udon - hoon constant - %term
      // try matching this before textRE so that
      // term%term doesn't appear to partially match
  ,   termRE = /^%[a-z][a-z\-]*(?: |$)/
      //
      // udon - hoon constant - ~zod
      // try matching this before textRE so that
      // zod~zod doesn't appear to partially match
      // XX - probably doesn't match udon parser exactly - fix me
      // (regex won't be able to handle this)
  ,   patpRE = /^~[a-z]+(?:\-[a-z]+)*(?: |$)/
      //
      // changed - don't exclude ~
      // match armRE, dateRE, hexRE, termRE, patpRE first
//,   textRE = /^[^#!\[\]*_\\<>` "'(~:]+/ // markdown
  ,   textRE = /^[^#!\[\]*_\\<>` "'(:]+/  // udon
      //
      // changed - don't allow ~~~ for code fencing
//,   fencedCodeRE = /^(~~~+|```+)[ \t]*([\w+#-]*)[^\n`]*$/ // markdown
  ,   fencedCodeRE = /^```(.*)$/                            // udon - match more than ```
      //
      // udon - sail expressions - ;html
      // XX - probably doesn't match udon parser exactly - fix me
  ,   sailRE = /^==$|;.*$/
      //
      // no change
  ,   expandedTab = "    " // CommonMark specifies tab as 4 spaces

  function switchInline(stream, state, f) {
    state.f = state.inline = f;
    return f(stream, state);
  }

  function switchBlock(stream, state, f) {
    state.f = state.block = f;
    return f(stream, state);
  }

  function lineIsEmpty(line) {
    return !line || !/\S/.test(line.string)
  }

  // Blocks

  function blankLine(state) {
    // Reset udonParseError state
    state.udonParseError = false; // udon
    // Reset linkHref state
    state.linkHref = false;
     // Reset linkText state
    state.linkText = false;
    // Reset EM state
    state.em = false;
    // Reset STRONG state
    state.strong = false;
    // Reset STRING state
    state.string = false; // udon
    // Reset opened EM STRONG STRING stack state
    state.essStack = []; // udon
    // Reset state.quote
    // state.quote = 0; // udon - no, block quotes can span blank lines
    // Reset state.trailingSpace
    state.trailingSpace = 0;
    state.trailingSpaceNewLine = false;
    // Mark this line as blank
    state.prevLine = state.thisLine
    state.thisLine = {stream: null}
    return null;
  }

  function blockNormal(stream, state) {
    var firstTokenOnLine = stream.column() === state.indentation;
    var prevLineIsList = state.list !== false;

    // udon - headers need to be followed by a blank line;
    //        this may be a udon parser bug, kind of like
    //        https://github.com/urbit/urbit/issues/1558
    //        XX this code does not catch the case of a
    //        fenced code block that directly follows a
    //        header.. are there more cases? - fix me
    //        (same with header following a header)
    if (state.prevLine.header === true && !lineIsEmpty(state.thisLine.stream)) {
      state.udonParseError = true;
    } else if (firstTokenOnLine && state.prevLine.hr) {
      state.udonParseError = false;
    }

    var lineIndentation = state.indentation;
    // compute once per line (on first token)
    if (state.indentationDiff === null) {
      state.indentationDiff = state.indentation;
      if (prevLineIsList) {
        // Reset inline styles which shouldn't propagate aross list items
        state.em = false;
        state.strong = false;
        state.string = false; // udon
        state.essStack = []; // udon
        state.code = false;

        state.list = null;
        // While this list item's marker's indentation is less than the deepest
        //  list item's content's indentation,pop the deepest list item
        //  indentation off the stack, and update block indentation state
        while (lineIndentation < state.listStack[state.listStack.length - 1]) {
          state.listStack.pop();
          if (state.listStack.length) {
            state.indentation = state.listStack[state.listStack.length - 1];
          // less than the first list's indent -> the line is no longer a list
          } else {
            state.list = false;
          }
        }
        if (state.list !== false) {
          state.indentationDiff = lineIndentation - state.listStack[state.listStack.length - 1]
        }
      }
    }

    var match = null;
    if (stream.eatSpace()) {
      return null;
    } else if (firstTokenOnLine && state.listStack.length == 0
        && state.quote == 0 && stream.column() == 8) { // udon - poem
      state.quote = 0;
      stream.match(/^.*$/); // match rest of line
      state.poem = true;
      var t = getType(state);
      state.poem = false;
      return t;
    } else if (firstTokenOnLine && (match = stream.match(atxHeaderRE))) {
      if (stream.column() != 0 || match[1].length > 6)
        state.udonParseError = true;
      if (stream.column() == 0 && state.quote) {
        state.quote = 0;
        state.udonParseError = match[1].length > 6;
      }
      state.header = match[1].length;
      state.thisLine.header = true;
      if (modeCfg.highlightFormatting) state.formatting = "header";
      state.f = state.inline;
      return getType(state);
    } else if ((match = stream.match(/^> /))) {
      state.quote = state.quote + 1;
      if (modeCfg.highlightFormatting) state.formatting = "quote";
      // ">  text" is a parser error, but ">  " is not
      if (stream.peek() == ' ' && !stream.match(/^ +$/))
        state.udonParseError = true;
      return getType(state);
    } else if (firstTokenOnLine && (match = stream.match(listRE))) {
      var listType = (match[1] == '+') ? "ol" : "ul";

      state.indentation = lineIndentation + stream.current().length;
      state.list = true;
      if (stream.column() == 0) {
        state.quote = 0;
        state.udonParseError = false;
      }

      // Add this list item's content's indentation to the stack
      state.listStack.push(state.indentation);

      state.f = state.inline;
      if (modeCfg.highlightFormatting) state.formatting = ["list", "list-" + listType];
      return getType(state);
    } else if (firstTokenOnLine && (match = stream.match(fencedCodeRE))) {
      if (stream.column() != 0 || match[1].length > 0)
        state.udonParseError = true;
      if (stream.column() == 0 && state.quote) {
        state.quote = 0;
        state.udonParseError = match[1].length > 0;
      }
      state.fencedEndRE = fencedCodeRE;
      // try switching mode
      state.f = state.block = local;
      if (modeCfg.highlightFormatting) state.formatting = "code-block";
      state.code = -1
      return getType(state);
    } else if (firstTokenOnLine && (match = stream.match(hrRE))) {
      if (stream.column() != 0 || match[1].length > 0)
        state.udonParseError = true;
      if (stream.column() == 0 && state.quote) {
        state.quote = 0;
        state.udonParseError = match[1].length > 0;
      }
      state.hr = true;
      state.thisLine.hr = true;
      return getType(state);
    } else if (firstTokenOnLine && stream.match(sailRE)) {
      if (stream.column() == 0 && state.quote) {
        state.quote = 0;
        state.udonParseError = false;
      }
      state.sail = true;
      var t = getType(state);
      state.sail = false;
      return t;
    }

    return switchInline(stream, state, state.inline);
  }

  function local(stream, state) {
    var currListInd = state.listStack[state.listStack.length - 1] || 0;
    var hasExitedList = state.indentation < currListInd;
    var maxFencedEndInd = currListInd + 3;
    var match;
    if (state.fencedEndRE && (match = stream.match(state.fencedEndRE))) {
      // might already be true from opening ```
      // but that has already been highlighted
      // so we'll turn it off..
      state.udonParseError = false;
      if (stream.column() != 0 || match[1].length > 0)
        state.udonParseError = true;
      if (stream.column() == 0 && state.quote) {
        state.quote = 0;
        state.udonParseError = match[1].length > 0;
      }
      if (modeCfg.highlightFormatting) state.formatting = "code-block";
      var returnType;
      if (!hasExitedList) returnType = getType(state)
      state.block = blockNormal;
      state.f = inlineNormal;
      state.fencedEndRE = null;
      state.code = 0
      if (hasExitedList) return switchBlock(stream, state, state.block);
      return returnType;
    } else {
      stream.skipToEnd();
      return tokenTypes.code;
    }
  }

  // Inline
  function getType(state) {
    var styles = [];

    // udon
    if (state.udonParseError && state.quote == 0 && state.listStack.length == 0)
      styles.push("error");

    if (state.formatting) {
      styles.push(tokenTypes.formatting);

      if (typeof state.formatting === "string") state.formatting = [state.formatting];

      for (var i = 0; i < state.formatting.length; i++) {
        styles.push(tokenTypes.formatting + "-" + state.formatting[i]);

        if (state.formatting[i] === "header") {
          styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.header);
        }

        // Add `formatting-quote` and `formatting-quote-#` for blockquotes
        // Add `error` instead if the maximum blockquote nesting depth is passed
        if (state.formatting[i] === "quote") {
          styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.quote);
        }
      }
    }

    if (state.linkHref) {
      styles.push(tokenTypes.linkHref, "url");
    } else { // Only apply inline styles to non-url text
      if (state.hr) { styles.push(tokenTypes.hr); } // udon
      if (state.poem) { styles.push(tokenTypes.poem); } // udon
      if (state.sail) { styles.push(tokenTypes.sail); } // udon
      if (state.string) { styles.push(tokenTypes.string); } // udon
      if (state.strong) { styles.push(tokenTypes.strong); }
      if (state.em) { styles.push(tokenTypes.em); }
      if (state.linkText) { styles.push(tokenTypes.linkText); }
      if (state.code) { styles.push(tokenTypes.code); }
      if (state.image) { styles.push(tokenTypes.image); }
      if (state.imageAltText) { styles.push(tokenTypes.imageAltText, "link"); }
      if (state.imageMarker) { styles.push(tokenTypes.imageMarker); }
    }

    if (state.header) { styles.push(tokenTypes.header, tokenTypes.header + "-" + state.header); }

    if (state.quote) {
      styles.push(tokenTypes.quote);

      // Add `quote-#`
      styles.push(tokenTypes.quote + "-" + state.quote);
    }

    if (state.list !== false) {
      var listMod = (state.listStack.length - 1) % 3;
      if (!listMod) {
        styles.push(tokenTypes.list1);
      } else if (listMod === 1) {
        styles.push(tokenTypes.list2);
      } else {
        styles.push(tokenTypes.list3);
      }
    }

    if (state.trailingSpaceNewLine) {
      styles.push("trailing-space-new-line");
    } else if (state.trailingSpace) {
      styles.push("trailing-space-" + (state.trailingSpace % 2 ? "a" : "b"));
    }

    return styles.length ? styles.join(' ') : null;
  }

  function handleText(stream, state) {
// udon start
    var column = stream.column();
    var firstTokenOnLine = column === state.indentation;
    if (column == 0 && lineIsEmpty(state.prevLine.stream)) {
      // "Blank newlines do not end the block quote,
      // but a blank newline followed by an unindented
      // line of text will end the quote." - udon docs
      state.quote = 0;
    }
    // udon - %columns-advanced parser error handling
    if (firstTokenOnLine) {
      if (state.quote) {
        if (column != 2 * state.quote)
          state.udonParseError = true;
      } else if (state.listStack.length > 0) {
        if (column != state.listStack[state.listStack.length - 1])
          state.udonParseError = true;
      } else {
        if (column != 0 && column != 8)
          state.udonParseError = true;
      }
    }
    // udon - hoon constants
    if (stream.match(armRE) || stream.match(dateRE) ||
        stream.match(hexRE) || stream.match(termRE) ||
        stream.match(patpRE)) {
      if (modeCfg.highlightFormatting) state.formatting = "code";
      var code = state.code;
      state.code = true;
      var t = getType(state);
      state.code = code;
      return t;
    }
// udon end
    if (stream.match(textRE)) {
      return getType(state);
    }
    return undefined;
  }

  function inlineNormal(stream, state) {
    var style = state.text(stream, state);
    if (typeof style !== 'undefined')
      return style;

    if (state.list) { // List marker (+ or -)
      state.list = null;
      return getType(state);
    }

    var ch = stream.next();

    // If this block is changed, it may need to be updated in GFM mode
    if (ch === '`') {
      var previousFormatting = state.formatting;
      if (modeCfg.highlightFormatting) state.formatting = "code";
      stream.eatWhile('`');
      var count = stream.current().length
      if (state.code == 0 && (!state.quote || count == 1)) {
        state.code = count
        return getType(state)
      } else if (count == state.code) { // Must be exact
        var t = getType(state)
        state.code = 0
        return t
      } else {
        state.formatting = previousFormatting
        return getType(state)
      }
    } else if (state.code) {
      return getType(state);
    }

    if (ch === '\\') {
      stream.next();
      if (modeCfg.highlightFormatting) {
        var type = getType(state);
        var formattingEscape = tokenTypes.formatting + "-escape";
        return type ? type + " " + formattingEscape : formattingEscape;
      }
    }

    if (ch === '!' && stream.match(/\[[^\]]*\] ?(?:\(|\[)/, false)) {
      state.imageMarker = true;
      state.image = true;
      if (modeCfg.highlightFormatting) state.formatting = "image";
      return getType(state);
    }

    if (ch === '[' && state.imageMarker && stream.match(/[^\]]*\](\(.*?\)| ?\[.*?\])/, false)) {
      state.imageMarker = false;
      state.imageAltText = true
      if (modeCfg.highlightFormatting) state.formatting = "image";
      return getType(state);
    }

    if (ch === ']' && state.imageAltText) {
      if (modeCfg.highlightFormatting) state.formatting = "image";
      var type = getType(state);
      state.imageAltText = false;
      state.image = false;
      state.inline = state.f = linkHref;
      return type;
    }

    if (ch === '[' && !state.image) {
      if (state.linkText && stream.match(/^.*?\]/)) return getType(state)
      state.linkText = true;
      if (modeCfg.highlightFormatting) state.formatting = "link";
      return getType(state);
    }

    if (ch === ']' && state.linkText) {
      if (modeCfg.highlightFormatting) state.formatting = "link";
      var type = getType(state);
      state.linkText = false;
      state.inline = state.f = stream.match(/\(.*?\)| ?\[.*?\]/, false) ? linkHref : inlineNormal
      return type;
    }

    if (ch === '*' || ch === '_' || ch === '"') { // udon - add '"'
      var setEm = null, setStrong = null, setString = null
      if (ch === '_')
        setEm = !state.em         // Em
      else if (ch === '*')
        setStrong = !state.strong // Strong
      else // '"'
        setString = !state.string // String
      if (modeCfg.highlightFormatting)
        if (setEm != null || setStrong != null) // udon - but not setString, '"' will be output
          state.formatting = setEm == null ? "strong" : setStrong == null ? "em" : "strong em"
      // pop the essStack while updating
      // state until tokenType is popped
      function essStackPop(tokenType)
      {
        while (state.essStack.length) {
          switch (state.essStack.pop()) {
            case tokenTypes.em:
              state.em = false
              if (tokenType == tokenTypes.em)
                return
              break
            case tokenTypes.strong:
              state.strong = false
              if (tokenType == tokenTypes.strong)
                return
              break
            case tokenTypes.string:
              state.string = false
              if (tokenType == tokenTypes.string)
                return
              break
          }
        }
      }
      // Em
      if (setEm === true) {
        state.em = true
        state.essStack.push(tokenTypes.em)
      } else if (setEm === false) {
        var t = getType(state) // highlight closing _
        essStackPop(tokenTypes.em)
        return t
      }
      // Strong
      if (setStrong === true) {
        state.strong = true
        state.essStack.push(tokenTypes.strong)
      } else if (setStrong === false) {
        var t = getType(state) // highlight closing *
        essStackPop(tokenTypes.strong)
        return t
      }
      // String
      if (setString === true) {
        state.string = true
        state.essStack.push(tokenTypes.string)
      } else if (setString === false) {
        var t = getType(state) // highlight closing "
        essStackPop(tokenTypes.string)
        return t
      }
      return getType(state)
    }

    if (ch === ' ') {
      if (stream.match(/^ +$/, false)) {
        state.trailingSpace++;
      } else if (state.trailingSpace) {
        state.trailingSpaceNewLine = true;
      }
    }

    return getType(state);
  }

  function linkHref(stream, state) {
    // Check if space, and return NULL if so (to avoid marking the space)
    if (stream.eatSpace()) {
      return null;
    }
    var ch = stream.next();
    if (ch === '(' || ch === '[') {
      state.f = state.inline = getLinkHrefInside(ch === '(' ? ')' : ']');
      if (modeCfg.highlightFormatting) state.formatting = "link-string";
      state.linkHref = true;
      return getType(state);
    }
    return "error";
  }

  var linkRE = {
    ')': /^(?:[^\\\(\)]|\\.|\((?:[^\\\(\)]|\\.)*\))*?(?=\))/,
    ']': /^(?:[^\\\[\]]|\\.|\[(?:[^\\\[\]]|\\.)*\])*?(?=\])/
  }

  function getLinkHrefInside(endChar) {
    return function(stream, state) {
      var ch = stream.next();

      if (ch === endChar) {
        state.f = state.inline = inlineNormal;
        if (modeCfg.highlightFormatting) state.formatting = "link-string";
        var returnState = getType(state);
        state.linkHref = false;
        return returnState;
      }

      stream.match(linkRE[endChar])
      state.linkHref = true;
      return getType(state);
    };
  }

  var mode = {
    startState: function() {
      return {
        f: blockNormal,

        prevLine: {stream: null},
        thisLine: {stream: null},

        // udon parser will error and not produce output
        udonParseError: false, // udon

        block: blockNormal,
        indentation: 0,

        inline: inlineNormal,
        text: handleText,

        formatting: false,
        linkText: false,
        linkHref: false,
        code: 0,
        em: false,
        strong: false,
        string: false, // udon
        essStack: [], // udon
        header: 0,
        hr: false,
        list: false,
        listStack: [],
        quote: 0,
        trailingSpace: 0,
        trailingSpaceNewLine: false,
        fencedEndRE: null
      };
    },

    copyState: function(s) {
      return {
        f: s.f,

        prevLine: s.prevLine,
        thisLine: s.thisLine,

        udonParseError: s.udonParseError, // udon

        block: s.block,
        indentation: s.indentation,

        inline: s.inline,
        text: s.text,
        formatting: false,
        linkText: s.linkText,
        linkHref: s.linkHref,
        code: s.code,
        em: s.em,
        strong: s.strong,
        string: s.string, // udon
        essStack: s.essStack, // udon
        header: s.header,
        hr: s.hr,
        list: s.list,
        listStack: s.listStack.slice(0),
        quote: s.quote,
        trailingSpace: s.trailingSpace,
        trailingSpaceNewLine: s.trailingSpaceNewLine,
        fencedEndRE: s.fencedEndRE
      };
    },

    token: function(stream, state) {

      // Reset state.formatting
      state.formatting = false;

      if (stream != state.thisLine.stream) {
        state.header = 0;
        state.hr = false;

        if (stream.match(/^\s*$/, true)) {
          blankLine(state);
          return null;
        }

        state.prevLine = state.thisLine
        state.thisLine = {stream: stream}

        // Reset state.trailingSpace
        state.trailingSpace = 0;
        state.trailingSpaceNewLine = false;

        if (true) {
          state.f = state.block;
          if (true) {
            var indentation = stream.match(/^\s*/, true)[0].replace(/\t/g, expandedTab).length;
            state.indentation = indentation;
            state.indentationDiff = null;
            if (indentation > 0) return null;
          }
        }
      }
      return state.f(stream, state);
    },

    innerMode: function(state) {
      return {state: state, mode: mode};
    },

    indent: function(state, textAfter, line) {
      return CodeMirror.Pass
    },

    blankLine: blankLine,

    getType: getType,

    closeBrackets: "()[]{}''\"\"``",

    fold: "udon"
  };
  return mode;
}, "xml");

CodeMirror.defineMIME("text/udon", "udon");

CodeMirror.defineMIME("text/x-udon", "udon");

});
