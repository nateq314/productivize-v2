import Document, {
  Head,
  Main,
  NextDocumentContext,
  NextScript
} from "next/document";
import { ServerStyleSheet } from "styled-components";

const { resetServerContext } = require("react-beautiful-dnd");

interface DocumentProps {
  styleTags: Array<React.ReactElement<{}>>;
}

export default class MyDocument extends Document<DocumentProps> {
  public static async getInitialProps({ renderPage }: NextDocumentContext) {
    const sheet = new ServerStyleSheet();

    resetServerContext(); // react-beautiful-dnd
    const page = renderPage((App) => (props) =>
      sheet.collectStyles(<App {...props} />)
    );

    const styleTags = sheet.getStyleElement();

    return { ...page, styleTags };
  }

  public render() {
    return (
      <html>
        <Head>
          <link rel="icon" href="/static/favicon.ico" key="favicon" />
          {this.props.styleTags}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
