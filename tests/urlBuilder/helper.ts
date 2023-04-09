/**
 * To encode uri components to be RFC 3986-compliant - which encodes the characters !'()*
 * @url https://stackoverflow.com/questions/44429173/javascript-encodeuri-failed-to-encode-round-bracket
 */
const fixedEncodeURIComponent = (str: string) =>
    encodeURIComponent(str).replace(
        /[!'()*]/g,
        c => '%' + c.charCodeAt(0).toString(16)
    );

export const enc = fixedEncodeURIComponent;
