import {
  ReactElement,
  RefObject,
  Dispatch,
  SetStateAction,
  MutableRefObject,
  CSSProperties,
} from "react";
import { SemanticWIDTHS } from "semantic-ui-react";
import Backend from "./components/AnnotatorClient/classes/Backend";
// common interfaces

///// UTIL

// For passing on setState functions, which can either take a value or a function
// export interface SetState<Type> {
//   (value: Type): void;
//   (value: (value: Type) => Type): void;
// }
// !! apparently this already exists as Dispatch<SetStateAction<string>>
//    where Dispatch<function> just says return value is voi

///// CONVENIENCE

// shorthand for the many setstate props being passed around
export type SetState<Type> = Dispatch<SetStateAction<Type>>;

// shorthand for the fullscreennode
export type FullScreenNode = MutableRefObject<HTMLDivElement | null>;

///// ANNOTATIONS
export type Span = [number, number];

export type Status = "DONE" | "IN_PROGRESS";

export interface Annotation {
  variable: string;
  value: string | number;
  field?: string;
  offset?: number;
  length?: number;
  index?: number;
  text?: string;
  span?: Span;
  token_span?: Span;
  color?: string;
}

/** An object with all annotations linked to a token, quickly accessible by their (unique) variable + '.' + value
 */
export interface TokenAnnotations {
  [key: string]: Annotation;
}

/** All tokenAnnotations quickly accessible by token index
 */
export interface SpanAnnotations {
  [key: number | string]: TokenAnnotations;
}

///// CODEBOOK

/** The codebook after the raw codebook has been processed  */
export interface CodeBook {
  type: "annotate" | "questions";
  variables?: Variable[];
  questions?: Question[];
  settings?: {
    instruction?: string;
    auto_instruction?: boolean;
    no_table?: boolean;
  };
}

/** The codebook in the JSON input format. */
export interface RawCodeBook {
  type: "annotate" | "questions";
  variables?: any;
  questions?: any;
  settings?: {
    no_table?: boolean;
  };
}

///// QUESTIONS MODE

export interface Question {
  name: string;
  type: QuestionType;
  question?: string;
  codes?: Code[];
  items?: QuestionItem[];
  single_row?: boolean;
  same_size?: boolean;
  button?: string;
  swipeOptions?: SwipeOptions;
  options?: AnswerOption[];
  showAnnotations?: string[];
}

export type QuestionType =
  | "search code"
  | "select code"
  | "scale"
  | "annotinder"
  | "confirm"
  | "inputs";

export interface QuestionItem {
  name: string;
  label?: string;
  type?: QuestionItemType;
  min?: number;
  max?: number;
  rows?: number;
  optional?: boolean;
  autocomplete?: string;
  ref?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

export type QuestionItemType = "email" | "number" | "textarea" | "text";

// an intermediate format that maps annotations to questions in 'questions' mode
export interface Answer {
  variable: string;
  items: AnswerItem[];
  length?: number;
  field?: string;
  offset?: number;
  makes_irrelevant?: string[];
}

export interface AnswerItem {
  item: string;
  values: (string | number)[];
  optional?: boolean;
  invalid?: boolean;
}

/** Answer options used in 'questions' mode */
export interface AnswerOption {
  /** the code string */
  code: string;
  /** If the codebook is hierarchical, an array of all the code parents */
  /** The color (e.g., for button display) */
  color: string;
  /** If the options are rendered as buttons, the ref enables navigation */
  tree?: string[];
  /** An array with names of questions (or all "REMAINING" question) that become irrelevant if this options is chosen */
  makes_irrelevant?: string[];
  /** Like makes_irrelevant, but the questions become irrelevant if this option is NOT chosen */
  required_for?: string[];
  ref?: RefObject<HTMLElement>;
}

/** An object that maps an AnswerOption to left, right and up swipes */
export type Swipes = "left" | "right" | "up";
export interface SwipeOptions {
  left: AnswerOption;
  right: AnswerOption;
  up: AnswerOption;
}

/** the refs to html elements used in swipeControl */
export interface SwipeRefs {
  text: RefObject<HTMLElement>;
  box: RefObject<HTMLElement>;
  code: RefObject<HTMLElement>;
}

/** Used in AnswerField to manage answers given in the sub components */
export interface OnSelectParams {
  /** The answer given.  */
  value?: string | number | (string | number)[];
  /** The item for which the answer is given (if question has multiple items) */
  itemIndex?: number;
  /** Only relevant if value is not an array. If false, the answer values array (AnswerItem.values) will always be
   * of length 1 (which we treat as a scalar). If true, the answer values array can have zero or multiple
   * values, and the value now given will be toggled in/out of the array.
   */
  multiple?: boolean;
  /** If True, giving this answer immediately finishes the question (posts annotations and goes to next question or unit) */
  finish?: boolean;
  /** If True, the current answer is marked as invalid, and the user will not be able to continue (if the value is required) */
  invalid?: boolean;
  /** If True, post the annotations but without going to the next question/unit */
  save?: boolean;
}

///// ANNOTATE MODE

export interface Variable {
  name: string;
  codes: Code[];
  instruction: string;
  searchBox: boolean;
  buttonMode: "all" | "recent";
  multiple: boolean;
  editMode: boolean;
  onlyImported: boolean;
  codeMap?: CodeMap;
}

/** This one's intentionally flexible, because the codeselector popup handles multiple types of selections */
export interface CodeSelectorValue {
  variable?: string;
  span?: Span;
  value?: string | number;
  delete?: boolean;
  cancel?: boolean;
}

/** This one's intentionally flexible, because the codeselector popup handles multiple types of selections */
export interface CodeSelectorOption {
  /** The value returned by the dropbox/buttonselection */
  value: CodeSelectorValue;
  /** label shown in buttonselection */
  label?: string | number;
  /** color of button */
  color?: string;
  /** text shown as a tag attached to the button */
  tag?: string | number;
  /** used in buttons to set text color */
  textColor?: string;
  /** If the options are rendered as buttons, the ref enables navigation */
  ref?: RefObject<HTMLElement>;
}

export interface CodeSelectorDropdownOption {
  /** Dropdown doesn't allow objects as values, so we use codes as values, and later find the full value */
  value: string;
  /** After getting the selected value, we can return the actual value object */
  fullvalue?: CodeSelectorValue;
  /** Used in dropdown for searching string match */
  text?: string;
  /** Used in dropdown to render label */
  content?: ReactElement;
}

export type TokenSelection = [number, number] | [];

///// CONDITIONALS

export interface Conditional {
  /** The variable name */
  variable: string;
  /** Annotation values and (optionally) positions */
  conditions: Condition[];
  /** Action if conditions are successful */
  onSuccess?: "applaud";
  /** Action if conditions failed */
  onFail?: "retry" | "block";
  /** The damage to the coder's health if conditions failed. */
  damage?: number;
  /** A markdown string for a message to display if conditions failed */
  message?: string;
}

export interface Condition {
  /** The value to compare the annotation value to. See 'operator' for comparison */
  value: string | number;
  /** The operator to compare the annotation value to the gold value. Default is == */
  operator?: "==" | "<=" | "<" | ">=" | ">" | "!=";
  /** If given, annotation needs to have this field */
  field?: string;
  /** If given, annotation needs to have this offset */
  offset?: number;
  /** If given, annotation needs to have this length */
  length?: number;
  /** The damage to the coder's health if this specific condition failed. (adds to damage specified in Conditional) */
  damage?: number;
  /** An additional markdown string for a message to display if this specific condition failed.
   * These are below the Conditional message.
   */
  submessage?: string;
}

export interface ConditionReport {
  // A record where keys are variables and values are objects with results of conditions
  [key: string]: Action;
}

export interface Action {
  /** action to perform. This is determined based on the unit type and whether condition is satisfied.     */
  action?: ConditionalAction;
  /** Message to display */
  message?: string;
  submessages?: string[];
  correct?: Annotation[];
  incorrect?: Annotation[];
}

export type ConditionalAction = "retry" | "block" | "applaud";

///// JOBSERVER

/**
 * A class providing everthing needed to run the Annotator component.
 * In particular, it needs to have a codebook and progress
 */
export interface JobServer {
  codebook: CodeBook;
  progress: Progress;
  return_link?: string;
  job_id?: number;
  setJobServer?: SetState<JobServer>;
  backend?: Backend;
  demodata?: DemoData;

  init: () => void;
  getUnit: (i: number) => Promise<BackendUnit>;
  postAnnotations: (
    unitId: number,
    annotation: Annotation[],
    status: Status
  ) => Promise<ConditionReport>;
  getDebriefing?: () => Promise<Debriefing>;
}

export interface DemoData {
  units?: BackendUnit[];
}

/**
 * An object containing information relevant for codingjob navigation
 */
export interface Progress {
  /** Total number of items a coder can coder in this job */
  n_total: number;
  /** Number of items that have been coded.  */
  n_coded: number;
  /** Should the coder be able to go back to already coded units? */
  seek_backwards?: boolean;
  /** Should the coder be able to move forward beyond currently coded units? */
  seek_forwards?: boolean;
}

///// UNIT DATA

export type UnitType = "pre" | "train" | "test" | "unit" | "post";

/** A unit after it has been prepared by the jobServer. This is for internal use */
export interface Unit {
  jobServer: any;
  unitIndex: number;
  unitId: number | string; // this is the backend id, not the external id
  annotations: Annotation[];
  status: UnitStatus;
  report?: ConditionReport;
  tokens?: RawToken[];
  text_fields?: TextField[];
  meta_fields?: MetaField[];
  image_fields?: ImageField[];
  markdown_fields?: MarkdownField[];
  settings?: {
    text_window_size: number | string;
  };
  importedAnnotations?: Annotation[];
  /** A unit can carry its own codebook. This will then be used instead of the codebook at the codingjob level */
  codebook?: CodeBook;
  variables?: UnitVariables;
}

/** A unit in the raw JSON structure. This is also the same structure in which it should be uploaded to the backend  */
export interface RawUnit {
  id: string; // The external id. A unique id provided when creating the codingjob
  type: UnitType;
  conditionals: Conditional[];
  unit: {
    text_fields?: TextField[];
    meta_fields?: MetaField[];
    image_fields?: ImageField[];
    markdown_field?: MarkdownField[];
    annotations?: Annotation[];
    importedAnnotations?: Annotation[];
    codebook?: RawCodeBook;
    variables?: UnitVariables;
  };
}

/** Units can have an object of variables, where keys are the variable names and values are pieces of text.
 *  These can be used in questions like: "is this text about [variable]"?.
 */
export interface UnitVariables {
  [key: string]: string;
}

/** A unit as it can be served by the backend. Basically extends rawunit (but not exactly), adding index and status.
 * Note that some parts (gold, damage) will normally not be visible to the frontend, but are included
 * here for jobserverdemo
 */
export interface BackendUnit {
  index: number;
  status: UnitStatus;
  external_id?: string;
  unit: {
    text_fields?: TextField[];
    meta_fields?: MetaField[];
    image_fields?: ImageField[];
    markdown_field?: MarkdownField[];
    annotations?: Annotation[];
    importedAnnotations?: Annotation[];
    codebook?: RawCodeBook;
    variables?: UnitVariables;
  };
  type: UnitType;
  conditionals?: Conditional[];
  damage?: number;
  report?: ConditionReport;
  annotation?: Annotation[]; // backend calls the annotations array annotation. Should probably change this
}

export type UnitStatus = "DONE" | "IN_PROGRESS";

export interface TextField {
  name: string;
  value: string;
  label?: string;
  offset?: number;
  unit_start?: number;
  unit_end?: number;
  context_before?: string;
  context_after?: string;
  paragraphs?: boolean;
  style?: CSSProperties;
}

export interface RenderedText {
  [key: string]: ReactElement[];
}

export interface ImageField {
  name: string;
  value: string;
  alt?: string;
  base64?: boolean;
  caption?: string;
  style?: CSSProperties;
}

export interface RenderedImages {
  [key: string]: ReactElement;
}

export interface MarkdownField {
  name: string;
  value: string;
  style?: CSSProperties;
}

export interface RenderedMarkdown {
  [key: string]: ReactElement;
}

export interface MetaField {
  name: string;
  value: string | number;
  label: string;
  style?: CSSProperties;
}

///// CODES

export interface Code {
  code: string;
  [key: string]: any;
}

export interface CodeMap {
  [key: string]: any;
}

export interface CodeTree {
  code: string;
  codeTrail: string[];
  [key: string]: any;
}

///// TOKENS

// token after parsing/preparing, as used in the annotator
export interface Token {
  field: string;
  paragraph: number;
  sentence: number;
  index: number;
  offset: number;
  length: number;
  text: string;
  codingUnit: boolean;
  pre: string;
  post: string;
  annotations: { name: string; value: string | number }[];
  containerRef?: any; // once rendered, a Token will carry refs for it's own element and it's container element
  ref?: any;
  arrayIndex?: number; // once rendered, the index of the rendered tokens. Can differ from 'index' if current unit is a subset of a document (so index does not start at 0)
  select?: (span: Span) => void; // a function that can be called on a token to select it
}

// token as it can occur in a unit. This includes alternative conventions in NLP parsers
// that will be converted to Token format
export interface RawToken {
  field?: string;
  paragraph?: number;
  sentence?: number;
  index?: number;
  offset?: number;
  length?: number;
  text?: string;
  codingUnit?: boolean;
  pre?: string;
  post?: string;
  annotations?: { name: string; value: string | number }[];
  token?: string;
  start?: number;
  end?: number;
  space?: string;
}

// raw token in column format.
export interface RawTokenColumn {
  field?: string[];
  paragraph?: number[];
  sentence?: number[];
  index?: number[];
  text?: string[];
  token?: string[];
  offset?: number[];
  length?: number[];
  start?: number[];
  end?: number[];
  pre?: string[];
  post?: string[];
  space?: string[];
  codingUnit?: boolean[];
  annotations?: { name: string; value: string | number }[][];
}

////// DOCUMENT

export interface Doc {
  /** A processed version of a Unit, for use in the Document component */
  tokens?: Token[];
  text_fields?: TextField[];
  meta_fields?: MetaField[];
  image_fields?: ImageField[];
  markdown_fields?: MarkdownField[];
}

export interface DocumentSettings {
  editAll: boolean;
  editMode: boolean;
}

export interface VariableValueMap {
  /** Keys are variable names, values are objects in which keys are code-values, and their value is always true.
   *  Used for quick lookup of whether a value is allowed to be used for a given variable
   */
  [key: string]: {
    [key: string]: boolean;
  };
}

export interface CodeHistory {
  /** Keys are variable names, values are arrays of values that the variable has recently been coded with */
  [key: string]: (string | number)[];
}

export interface VariableMap {
  [key: string]: Variable;
}

export interface TriggerCodePopup {
  (index: number, span: Span): void;
}

///// FULLDATATABLE

export interface TableData {
  rows: RowObj[];
  page: number;
  pages: number;
}

/** An object where keys are column names and values their value for this particular row */
export interface RowObj {
  [key: string]: any;
}

export interface Column {
  /** The name of the column to show */
  name: string;
  /** The column label. If empty, uses name */
  label?: string;
  /** The width of the column, in Semantic UIs 16-part format */
  width?: SemanticWIDTHS;
  /** A function that takes the rowObj as input and returns what to show in the table */
  f?: (row: RowObj) => number | string | ReactElement;
  /** If TRUE, add title to span so full value shows on hover */
  title?: boolean;
  date?: boolean;
  hide?: boolean;
  ref?: RefObject<HTMLElement>;
}

export interface ButtonComponentProps {
  key: string;
  row: RowObj;
  backend: Backend;
  setData: SetState<RowObj[]>;
  style: CSSProperties;
}

///// MANAGE USERS

export interface User {
  email: string;
  admin: boolean;
  password?: string;
}

///// MANAGE JOBS

export interface Job {
  id: number;
  title: string;
  created: string;
  creator: string;
  archived?: boolean;
  restricted?: boolean;
  users?: User[];
  jobset_details?: JobSet[];
  rules?: Rules;
  n_total: number;
}

export interface JobSet {
  name: string;
  units?: RawUnit[];
  codebook?: CodeBook;
  n_units?: number;
}

export interface Rules {
  ruleset: "crowdcoding" | "fixedset";
  [key: string]: any;
}

export interface JobSettings {
  archived?: boolean;
  restricted?: boolean;
}

export interface JobAnnotation {
  jobset: string;
  unit_id: string;
  coder: string;
  annotation: Annotation[];
  status: Status;
}

///// OTHER

export interface Debriefing {
  message?: string;
  link?: string;
  link_text?: string;
  /** The link can contain {user_id}, which will be replaced by the user_id from the backend
   *  This is mainly usefull for redirecting coders to a panel company, which can need their ID to pay them
   */
  user_id?: string;
  /** If True, show QR code for sharing the job with other people */
  qr?: boolean;
}

export interface SessionData {
  seenInstructions: Record<string, boolean>;
}
