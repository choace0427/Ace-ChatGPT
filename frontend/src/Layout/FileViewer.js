import { useState, useRef } from "react";
import axios from "axios";
import FileViewer from "react-file-viewer";
import { Logger } from "logging-library";
import { CustomErrorComponent } from "custom-error";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pdf from "@mikecousins/react-pdf";
import { Upload } from "antd";

const { Dragger } = Upload;

export default function FilePreviewer(prop) {
  const [state, setState] = useState(true);
  const [data, setData] = useState("");

  const [url, setUrl] = useState(" ");
  const props = {
    name: "file",
    accept: "application/pdf",
    onChange(info) {
      setData(info.file.originFileObj);
      setUrl(URL.createObjectURL(info.file.originFileObj));
      setState(false);
    },
  };
  const [page, setPage] = useState(1);

  const training = () => {
    prop.handlestate(true);
    const formData = new FormData();
    formData.append("file", data);
    axios
      .post("http://localhost:5000/training", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        if (res.status === 200) {
          toast.success("Congratulations! Embedding Successful!.", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          prop.handlestate(false);
        }
      })
      .catch((err) => {
        toast.error("This is Network Error.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        prop.handlestate(false);
      });
  };

  function clearFiles() {
    setState(true);
  }
  return (
    <div>
      {state ? (
        <Dragger {...props} id="file-input">
          <p className="ant-upload-drag-icon">{/* <Icon type="inbox" /> */}</p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload. Strictly prohibit from
            uploading company data or other band files
          </p>
        </Dragger>
      ) : (
        <div className="btn-container">
          <br />
          <div className="w-full">
            <Pdf file={url} page={page} className="Pdf">
              {({ pdfDocument, pdfPage, canvas }) => (
                <>
                  {!pdfDocument && <span>Loading...</span>}
                  {canvas}
                  {Boolean(pdfDocument && pdfDocument.numPages) && (
                    <div class="flex flex-row mx-auto justify-center mt-[12px]">
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        class="bg-transparent hover:bg-[#2779bd] text-blue-dark font-semibold hover:text-white py-2 px-4 border border-[#2779bd] hover:border-transparent rounded-full mr-2"
                      >
                        <div class="flex flex-row align-middle">
                          <svg
                            class="w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                              clip-rule="evenodd"
                            ></path>
                          </svg>
                        </div>
                      </button>
                      <span className="flex items-center px-[5px] text-[25px] font-medium text-[#2779bd]">
                        {pdfDocument.numPages} / {page}
                      </span>
                      <button
                        type="button"
                        disabled={page === pdfDocument.numPages}
                        onClick={() => setPage(page + 1)}
                        class="bg-transparent hover:bg-[#2779bd] text-blue-dark font-semibold hover:text-white py-2 px-4 border border-[#2779bd] hover:border-transparent rounded-full ml-2"
                      >
                        <div class="flex flex-row align-middle">
                          <svg
                            class="w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                              clip-rule="evenodd"
                            ></path>
                          </svg>
                        </div>
                      </button>
                    </div>
                  )}
                </>
              )}
            </Pdf>

            <div className="flex justify-between mt-12">
              <button
                onClick={clearFiles}
                class="w-full bg-transparent hover:bg-[#cc1f1a] text-[#cc1f1a] font-semibold hover:text-white py-2 px-4 border border-[#cc1f1a] hover:border-transparent rounded-full mr-2"
              >
                Delete
              </button>
              <button
                onClick={training}
                class="w-full bg-transparent hover:bg-[#2779bd] text-[#2779bd] font-semibold hover:text-white py-2 px-4 border border-[#2779bd] hover:border-transparent rounded-full mr-2"
              >
                Training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
