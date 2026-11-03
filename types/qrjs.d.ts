declare module 'qr.js' {
  interface QRCode {
    modules: boolean[][];
    addData(data: string): void;
    make(): void;
  }
  function QRCode(data: string, opt?: any): QRCode;
  namespace QRCode {
    const ErrorCorrectLevel: any;
  }
  export = QRCode;
}
