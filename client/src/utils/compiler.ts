export const compilerTemplate = (html: string, css: string, js: string): string => {
    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                ${css}
            </style>
        </head>
        <body>
            ${html}
            <script>
                try {
                    ${js}
                } catch (err) {
                    console.error("Runtime Error in Playground:", err);
                }
            </script>
        </body>
    </html>
    `;
};