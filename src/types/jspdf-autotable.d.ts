import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }

  interface AutoTableOptions {
    head?: CellInput[][] | RowInput[];
    body?: CellInput[][] | RowInput[];
    foot?: CellInput[][] | RowInput[];
    columns?: ColumnInput[];
    styles?: StyleInput;
    columnStyles?: { [key: string]: StyleInput };
    headStyles?: StyleInput;
    bodyStyles?: StyleInput;
    footStyles?: StyleInput;
    alternateRowStyles?: StyleInput;
    columnWidth?: number | 'auto' | 'wrap';
    margin?: MarginInput;
    tableWidth?: number | 'auto' | 'wrap';
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableLineWidth?: number;
    tableLineColor?: Color;
    startY?: number;
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    horizontalPageBreak?: boolean;
    horizontalPageBreakRepeat?: string;
    didParseCell?: (data: HookData) => void;
    willDrawCell?: (data: HookData) => void;
    didDrawCell?: (data: HookData) => void;
    didDrawPage?: (data: HookData) => void;
  }

  // Tipos auxiliares
  type CellInput = string | number | { content: string | number; styles?: StyleInput };
  type RowInput = (string | number | { content: string | number })[];
  type ColumnInput = { header?: string; dataKey: string } | string;
  type Color = number | string | number[];
  type MarginInput = number | { top?: number; right?: number; bottom?: number; left?: number };

  interface StyleInput {
    font?: 'helvetica' | 'times' | 'courier' | string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    fontSize?: number;
    cellPadding?: number;
    lineWidth?: number;
    lineColor?: Color;
    fillColor?: Color;
    textColor?: Color;
    halign?: 'left' | 'center' | 'right' | 'justify';
    valign?: 'top' | 'middle' | 'bottom';
    fillStyle?: 'S' | 'F' | 'DF';
    cellWidth?: 'auto' | 'wrap' | number;
    minCellHeight?: number;
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
  }

  interface HookData {
    table: any;
    pageNumber: number;
    settings: any;
    doc: jsPDF;
    cell: any;
    row: any;
    column: any;
    section: 'head' | 'body' | 'foot';
  }
}