/** Lit package ships JS only; suppress implicit any when importing symbols for registration side effects. */
declare module '@disciple.tools/web-components' {
  export class DtText extends HTMLElement {
    static styles: unknown
  }
  export class DtSingleSelect extends HTMLElement {
    static styles: unknown
  }
}
