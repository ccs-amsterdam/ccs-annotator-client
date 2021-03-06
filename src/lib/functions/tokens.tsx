import nlp from "compromise";
import { TextField, Token, RawToken, RawTokenColumn } from "../types";
import paragraphs from "compromise-paragraphs";
nlp.extend(paragraphs);

/**
 * Tokenize a document, but allowing for multiple text fields to be concatenated as different fields.
 * @param {*} text_fields  An array of objects, where each object has the structure {name, value}. 'name' becomes the name of the field, 'value' is the text
 *                         each item can also have an 'offset' key with an integer value, in case the value is a subset starting at the [offset] character (this is needed to get the correct positions in the original document)
 *                         each item can also have a 'unit_start' and 'unit_end' key, each with an integer value to indicate where in this text_field the codingUnit starts/ends.
 *                         If both unit_start and unit_end is omitted, the whole text is considered codingUnit.
 *                         As an alternative to unit_start and unit_end, can also have context_before and context_after to specify context, which should both be strings
 * @returns
 */
export const parseTokens = (text_fields: TextField[]): Token[] => {
  const tokens: Token[] = [];
  let token = null;
  let paragraph = 0; // offset can be used if position in original article is known
  let sentence = 0;
  let tokenIndex = 0;
  let t = null;
  let text = null;

  let has_unit_start = false;
  for (let text_field of text_fields)
    if (text_field.unit_start != null || text_field.context_before != null) has_unit_start = true;
  let unit_started = !has_unit_start; // if unit start not specified, start from beginning
  let unit_ended = false;

  for (let text_field of text_fields) {
    let field = text_field.name || "text";
    let offset = text_field.offset || 0;

    text = text_field.value;
    if (text_field.context_before != null) {
      text = text_field.context_before + text;
      text_field.unit_start = text_field.context_before.length - 1;
    }
    if (text_field.context_after != null) {
      text_field.unit_end = text.length - 1;
      text = text + text_field.context_after;
    }

    const tokenized = nlp.tokenize(text) as any; // circumvent some typescript issues
    t = tokenized.paragraphs().json({ offset: true });
    // map to single array.
    for (let par = 0; par < t.length; par++) {
      for (let sent = 0; sent < t[par].sentences.length; sent++) {
        for (let sent2 = 0; sent2 < t[par].sentences[sent].length; sent2++) {
          // for some reason there's an extra array layer between sents and pars...
          // I've only found cases where lenght is 1, but I'll map it just in case
          for (let term = 0; term < t[par].sentences[sent][sent2].terms.length; term++) {
            token = t[par].sentences[sent][sent2].terms[term];

            if (
              text_field.unit_start != null &&
              token.offset.start + offset >= text_field.unit_start
            )
              unit_started = true;
            if (text_field.unit_end != null && token.offset.start + offset > text_field.unit_end)
              unit_ended = true;

            const tokenobj: Token = {
              field: field,
              offset: token.offset.start + offset,
              length: token.offset.length,
              paragraph: paragraph,
              sentence: sentence,
              index: tokenIndex,
              text: token.text,
              pre: token.pre,
              post: token.post,
              codingUnit: unit_started && !unit_ended,
              annotations: [],
            };
            tokens.push(tokenobj);
            tokenIndex++;
          }
        }
        sentence++;
      }
      paragraph++;
    }
  }
  return tokens;
};

export const importTokens = (tokens: RawToken[] | RawTokenColumn): Token[] => {
  if (!Array.isArray(tokens)) tokens = tokensColumnToRow(tokens);

  let paragraph = 0;
  let last_paragraph = tokens[0].paragraph;

  let sentence = 0;
  let last_sentence = tokens[0].sentence;

  let offset = 0;
  let totalLength = 0;

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].text == null) {
      if (tokens[i].token != null) {
        tokens[i].text = tokens[i].token;
      } else {
        alert("Invalid token data:\n\nimported tokens must have 'text' or 'token' field");
        return null;
      }
    }
    if (tokens[i].offset == null && tokens[i].start != null) tokens[i].offset = tokens[i].start;
    if (tokens[i].length == null) tokens[i].length = tokens[i].text.length;

    if (tokens[i].pre == null) tokens[i].pre = "";
    if (tokens[i].post == null && tokens[i].space != null) tokens[i].post = tokens[i].space;
    if (tokens[i].post == null) {
      if (tokens[i].offset != null && tokens[i].length != null) {
        tokens[i].post =
          i < tokens[i].length - 1
            ? " ".repeat(Math.max(0, tokens[i + 1].offset - tokens[i].offset - tokens[i].length))
            : "";
      } else {
        tokens[i].post = " ";
      }
    }

    totalLength = tokens[i].length + tokens[i].post.length;
    if (i < tokens.length - 1) totalLength = totalLength + (tokens[i + 1].pre?.length || 0);

    if (tokens[i].offset == null) {
      tokens[i].offset = offset;
      offset = offset + totalLength;
    }

    if (i < tokens.length - 1) {
      if (!tokens[i].field || tokens[i].field === tokens[i + 1].field) {
        if (tokens[i + 1].offset == null && tokens[i + 1].start != null)
          tokens[i + 1].offset = tokens[i + 1].start;
        if (tokens[i + 1].offset && tokens[i + 1].offset < tokens[i].offset + totalLength) {
          alert(
            `Invalid token position data. The length of "${
              tokens[i].pre + tokens[i].text + tokens[i].post
            }" on position ${tokens[i].offset} exeeds the offset/start position of the next token`
          );
          return null;
        }
      }
    }

    // ensure sentence counter
    // currently doesn't actually do sentence boundary detection (if people want that,
    // they should include sentence in the input)
    // if sentence exists, still overwrite with new counter to ensure that it adds up
    // also increment sentence on new paragraph
    if (tokens[i].sentence == null) {
      tokens[i].sentence = sentence;
      if (tokens[i].text.includes("\n") || tokens[i].post.includes("\n")) sentence++;
    } else {
      if (tokens[i].paragraph !== last_paragraph || tokens[i].sentence !== last_sentence) {
        last_sentence = tokens[i].sentence;
        sentence++;
      }
      tokens[i].sentence = sentence;
    }

    // ensure paragraph counter
    // if paragraph exists, still overwrite with new counter to ensure that it adds up
    if (tokens[i].paragraph == null) {
      tokens[i].paragraph = paragraph;
      if (tokens[i].text.includes("\n") || tokens[i].post.includes("\n")) paragraph++;
    } else {
      if (tokens[i].paragraph !== last_paragraph) {
        last_paragraph = tokens[i].paragraph;
        paragraph++;
      }
      tokens[i].paragraph = paragraph;
    }

    if (tokens[i].field == null) tokens[i].field = "text";
    tokens[i].index = i;
  }

  const preparedTokens: Token[] = [];
  for (let token of tokens) {
    // to appease typescript
    const preparedToken: Token = {
      field: token.field ?? "",
      offset: token.offset ?? 0,
      length: token.length ?? 0,
      paragraph: token.paragraph ?? 0,
      sentence: token.sentence ?? 0,
      index: token.index ?? 0,
      text: token.text ?? "",
      pre: token.pre ?? "",
      post: token.post ?? "",
      codingUnit: token.codingUnit ?? true,
      annotations: token.annotations ?? [],
    };
    preparedTokens.push(preparedToken);
  }
  return preparedTokens;
};

export const importTokenAnnotations = (tokens: Token[]) => {
  // returns annotations
  if (tokens.length === 0) return [];
  let annotations: any = [];
  let codeTracker: any = {};
  let field = tokens[0].field;
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].annotations) {
      for (let annotation of Object.values(codeTracker)) annotations.push(annotation);
      codeTracker = {};
      continue;
    }

    let annotationDict: any = {};
    for (let annotation of tokens[i].annotations) {
      if (annotation.value === "") continue; // Whether to skip should be a parameter when importing

      annotationDict[annotation.name] = annotation.value;

      const prevTokenPost = i > 0 ? tokens[i - 1].post : "";
      if (codeTracker[annotation.name] == null)
        codeTracker[annotation.name] = {
          index: i,
          variable: annotation.name,
          value: annotation.value,
          offset: tokens[i].offset,
          text: tokens[i].text,
          field: tokens[i].field,
          length: tokens[i].length,
        };
      if (codeTracker[annotation.name].value === annotation.value) {
        codeTracker[annotation.name].length =
          tokens[i].offset + tokens[i].length - codeTracker[annotation.name].offset;
        codeTracker[annotation.name].text += prevTokenPost + tokens[i].pre + tokens[i].post;
      }
    }

    for (let key of Object.keys(codeTracker)) {
      if (annotationDict[key] == null) {
        annotations.push(codeTracker[key]);
        delete codeTracker[key];
        continue;
      }
      if (annotationDict[key] !== codeTracker[key].value) {
        annotations.push(codeTracker[key]);
        codeTracker[key] = {
          index: i,
          variable: key,
          value: annotationDict[key],
          offset: tokens[i].offset,
          text: tokens[i].text,
          field: tokens[i].field,
          length: tokens[i].length,
        };
      }
    }

    if (i < tokens.length - 1 && tokens[i + 1].field !== field) {
      for (let annotation of Object.values(codeTracker)) annotations.push(annotation);
      codeTracker = {};
      field = tokens[i].field;
      continue;
    }
  }

  for (let annotation of Object.values(codeTracker)) annotations.push(annotation);

  return annotations;
};

/**
 * changes tokens in column format
 *  {{offset: [1,2], token: ["hello","world"]}
 * to row format
 *  [{offset: 1, token: "hello"}, {offset: 2, token: "world"}]
 *
 * row format is easier to work with, but column format is more efficient
 * so allow it to be used as input.
 * @param {} tokens
 */
export const tokensColumnToRow = (tokens: RawTokenColumn): RawToken[] => {
  const columns: string[] = Object.keys(tokens);
  const n = tokens[columns[0] as keyof RawTokenColumn].length;

  const tokensArray = [];
  for (let i = 0; i < n; i++) {
    const token: RawToken = columns.reduce((obj, column) => {
      obj[column] = tokens[column as keyof RawTokenColumn][i];
      return obj;
    }, {} as any);

    tokensArray.push(token);
  }

  return tokensArray;
};
