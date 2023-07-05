const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const fileupload = require("express-fileupload");
const { OpenAI } = require("langchain/llms/openai");
const { TokenTextSplitter } = require("langchain/text_splitter");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { PineconeClient } = require("@pinecone-database/pinecone");
const { PineconeStore } = require("langchain/vectorstores/pinecone");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { CallbackManager } = require("langchain/callbacks");

const { Readable } = require("stream");

const cors = require("cors");
require("dotenv").config();
const fs = require("fs");
const {
  PuppeteerWebBaseLoader,
} = require("langchain/document_loaders/web/puppeteer");
const { loadQAChain } = require("langchain/chains");
const { PromptTemplate } = require("langchain");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileupload());

/*-------------------------------------Chat------------------------------------------*/

app.post("/chat", async (req, res) => {
  const userData = req.body;
  const questionstate = userData.state;
  const answerstate = userData.answer;
  const gptanswerstate = userData.gptanswer;

  try {
    const client = new PineconeClient();
    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });

    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
      { pineconeIndex, namespace: "abpitest" }
    );

    const llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.3,
      modelName: "text-davinci-003",
    });

    const results = await vectorStore.similaritySearch(userData.data, 5);

    let total = [];
    for (let index = 0; index < results.length; index++) {
      total.push(results[index]);
    }

    if (questionstate) {
      res.status(200).send({
        data: `Would you like me to review how compliant this ${userData.condition.intention} attachment is when it is used for ${userData.condition.purpose} to ${userData.condition.audience} with the abpi code`,
        state: true,
      });
    } else {
      if (answerstate) {
        const prompt =
          PromptTemplate.fromTemplate(`${userData.data} This is positive answer or negative answer? if positive answer, display 'Positive'. if not, display 'negative'.
        {context}
        Human: {question}
        Answer in Markdown:
        `);
        const chain = loadQAChain(llm, {
          type: "stuff",
          prompt: prompt,
        });

        let rowletter;
        const result = await chain.call({
          input_documents: total,
          question: userData.data,
        });

        // Assign the row returned from the API to rowletter
        if (Object.keys(result).length > 0) {
          if (gptanswerstate == false) {
            const chain = loadQAChain(llm, {
              type: "stuff",
            });

            let rowletter;
            const result = await chain.call({
              input_documents: total,
              question: userData.data,
            });
            rowletter = result.text;
            res.status(200).send({
              data: rowletter,
              answerstate: false,
              state: false,
              gptanswerstate: true,
            });
          } else {
            if (
              result.text.includes("Positive") ||
              result.text.includes("positive")
            ) {
              res.status(200).send({
                data: "Okay, I can answer for your question from now.",
                answerstate: true,
                state: false,
                gptanswerstate: false,
              });
            } else {
              res.status(200).send({
                data: `Sorry, Please accept this question. Would you like me to review how compliant this ${userData.condition.intention} attachment is when it is used for ${userData.condition.purpose} to ${userData.condition.audience} with the abpi code `,
                answerstate: true,
                state: false,
                questionstate: true,
                gptanswerstate: true,
              });
            }
          }
          //
        } else {
          res.status(500).send({ data: "Server Error!" });
        }

        res.end();
      } else {
        const prompt =
          PromptTemplate.fromTemplate(`{intention} attachment which will be used for {purpose} to a {audience} with the ABPI code.
        {context}
        Human: {question}
        Answer in Markdown:
        `);

        const chain = loadQAChain(llm, {
          type: "stuff",
          // prompt: prompt,
          // intention: userData.condition.intention,
          // purpose: userData.condition.purpose,
          // audience: userData.condition.audience,
        });

        let rowletter;
        const result = await chain.call({
          input_documents: total,
          question: userData.data,
        });

        // Assign the row returned from the API to rowletter
        if (Object.keys(result).length > 0) {
          rowletter = result;
        } else {
          res.status(500).send({ data: "Server Error!" });
        }
        res.status(200).send({ data: rowletter, state: true });
      }
    }
  } catch (err) {
    res.status(500).send("Internal server error occurred");
  }
});

/*-------------------------------------Embedding------------------------------------------*/
app.post("/training", async (req, res) => {
  const newpath = __dirname + "/";

  const file = req.files.file;
  const filename = file.name;
  let numberCharacters = 0;

  await file.mv(`${newpath}${filename}`, async (err) => {
    if (err) {
      err_msg = "Upload Failed";
    }

    /*-------------------------------------File create in local------------------------------------------*/

    const loader = new PDFLoader(filename.toString(), {
      splitPages: true,
      pdfjs: () => import("pdf-parse/lib/pdf.js/v1.9.426/build/pdf.js"),
    });
    const docs = await loader.load();

    /*-------------------------------------File delete in local------------------------------------------*/

    fs.unlink(filename.toString(), (err) => {
      if (err) {
        throw err;
      }
    });

    /*-------------------------------------Vector sprit------------------------------------------*/

    const splitter = new TokenTextSplitter({
      chunkSize: 100,
      chunkOverlap: 0,
    });
    const output = await splitter.createDocuments([docs[0].pageContent]);
    numberCharacters = docs[0].pageContent.length;

    /*-------------------------------------Pinecone connect------------------------------------------*/

    const client = new PineconeClient();

    let state = await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);
    const result = { _id: "abpitest" };
    await PineconeStore.fromDocuments(
      output,
      new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
      { pineconeIndex, namespace: result._id, textKey: "text" }
    );
    res.json({ msg: "reer" });
  });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

app.listen(async () => {
  const filename = "abpi-code-of-practice_final.pdf";
  const loader = new PDFLoader(filename.toString(), {
    splitPages: true,
    pdfjs: () => import("pdf-parse/lib/pdf.js/v1.9.426/build/pdf.js"),
  });
  const docs = await loader.load();

  /*-------------------------------------Vector sprit------------------------------------------*/

  const splitter = new TokenTextSplitter({
    chunkSize: 100,
    chunkOverlap: 0,
  });
  const output = await splitter.createDocuments([docs[0].pageContent]);
  numberCharacters = docs[0].pageContent.length;

  /*-------------------------------------Pinecone connect------------------------------------------*/

  const client = new PineconeClient();

  let state = await client.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX);
  await PineconeStore.fromDocuments(
    output,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
    { pineconeIndex, namespace: "abpitest", textKey: "text" }
  );
});
