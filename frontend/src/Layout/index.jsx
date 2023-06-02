import React, { useState } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import FilePreviewer from "./FileViewer";

import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Divider, FormGroup } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LinearProgress from "@mui/material/LinearProgress";

const audiencedata = [
  "Patient",
  "HCP",
  "Payer",
  "Regulated body e.g. EMA, NICE",
  "Healthcare institutions e.g. NHS",
  "Medical and scientific associations e.g. ASCO",
  "Patient advocacy groups e.g. National Organization for Rare Disorders",
  "Government and policymakers e.g. Ministers, civil servants, officially appointed Chief Scientific Advisers, Parliamentary Committee members",
  "Investors and shareholders",
  "Media and general public",
  "Other – option to add free text",
];

const purposedata = [
  "Providing scientific and/or clinical information e.g. disease awareness, advertisement, detail aid, publication ",
  "Reporting safety and efficacy information e.g. clinical trial outcomes, patient outcomes",
  "Delivering educational and/or training programme e.g. medical education",
  "Improving patient access e.g. early access programme",
  "Submitting to a regulated body e.g. EMA, HTA body",
  "An external meeting e.g. advisory board, legitimate exchange, symposia, conference",
  "Other – option to add free text",
];

const intentiondata = ["Promotional", "Non-promotional"];

export default function Layout() {
  //Tablist value
  const [value, setValue] = useState("training");
  const [uploadstate, setUploadState] = useState(false);

  //chat result value
  const [prompt, setPrompt] = useState("");
  const [data, setData] = useState([]);

  //spinner value
  const [loading, setLoading] = useState(false);

  //answer & question value
  const [questionstate, setQuestionState] = useState(true);
  const [answerstate, setAnswerState] = useState(true);
  const [gptanswerstate, setGPTAnswerState] = useState(true);

  //props
  const [docstate, setDocState] = useState(true);

  //prompt value
  const [selectval, setSelectVal] = useState("");
  const [formValues, setFormValues] = useState({
    audience: "",
    purpose: "",
    intention: "",
  });

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };
  const handleChange = (e) => {
    setPrompt(e.target.value);
  };

  const scrollToBottom = () => {
    var nestedElement = document.getElementById("chat");
    if (nestedElement) {
      nestedElement.scrollTo(0, nestedElement.scrollHeight);
    }
  };

  const handleChat = async () => {
    if (formValues.audience && formValues.intention && formValues.purpose) {
      setData([
        ...data,
        {
          Human: prompt,
          Bot: "",
        },
      ]);
      let chatData = [
        ...data,
        {
          Human: prompt,
          Bot: "",
        },
      ];
      setLoading(true);
      setPrompt("");
      axios
        .post(`http://localhost:5000/chat`, {
          data: prompt,
          condition: formValues,
          state: questionstate,
          answer: answerstate,
          gptanswer: gptanswerstate,
        })
        .then((res) => {
          let i = 0;
          let string = "";
          if (res.data.state) {
            setQuestionState(false);
            const dataArray = res.data.data.split(" ");
            const intervalId = setInterval(() => {
              if (i >= dataArray.length) {
                clearInterval(intervalId);
              } else {
                string += dataArray[i] + " ";
                chatData[chatData.length - 1].Bot = string;
                setData([
                  ...data,
                  {
                    Human: prompt,
                    Bot: string,
                  },
                ]);
                i++;
              }
            }, 100);
            setLoading(false);
          } else {
            if (res.data.answerstate == true) {
              setGPTAnswerState(res.data.gptanswerstate);
              setAnswerState(res.data.answerstate);
              const dataArray = res.data.data.split(" ");
              const intervalId = setInterval(() => {
                if (i >= dataArray.length) {
                  clearInterval(intervalId);
                } else {
                  string += dataArray[i] + " ";
                  chatData[chatData.length - 1].Bot = string;
                  setData([
                    ...data,
                    {
                      Human: prompt,
                      Bot: string,
                    },
                  ]);
                  i++;
                }
              }, 100);
            } else {
              const dataArray = res.data.data.split(" ");
              const intervalId = setInterval(() => {
                if (i >= dataArray.length) {
                  clearInterval(intervalId);
                } else {
                  string += dataArray[i] + " ";
                  chatData[chatData.length - 1].Bot = string;
                  setData([
                    ...data,
                    {
                      Human: prompt,
                      Bot: string,
                    },
                  ]);
                  i++;
                }
              }, 100);
            }
            setLoading(false);
          }
        })
        .catch((err) => {
          toast.error("Network Error. Please check network state", {
            position: "top-right",
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          setLoading(false);
        });
    } else {
      toast.error("Please select Prompt Conditions", {
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setTimeout(() => {
        setValue("prompt");
      }, 500);
    }
  };

  setTimeout(scrollToBottom, 2000);
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleAudienceChange = (event) => {
    setFormValues({ ...formValues, audience: event.target.value });
  };

  const handlePurposeChange = (event) => {
    setFormValues({ ...formValues, purpose: event.target.value });
  };
  const handleIntentionChange = (event) => {
    setFormValues({ ...formValues, intention: event.target.value });
  };
  const handleembedding = (upload_state) => {
    setUploadState(upload_state);
  };

  const handleDocstate = (state) => {
    setDocState(state);
  };

  const handleSelect = (event) => {
    const { value } = event.target;
    setSelectVal(value);
  };

  const handleAddOption = (event) => {
    const { id } = event.target;

    switch (id) {
      case "audience":
        audiencedata.push(selectval);
        setFormValues({
          ...formValues,
          audience: selectval,
        });
        break;
      case "intention":
        intentiondata.push(selectval);
        setFormValues({ ...formValues, intention: selectval });
        break;
      case "purpose":
        purposedata.push(selectval);
        setFormValues({ ...formValues, purpose: selectval });
        break;
    }
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleChat();
    }
  };

  return (
    <>
      {uploadstate ? (
        <Box sx={{ width: "100%" }}>
          <LinearProgress />
        </Box>
      ) : (
        <Box sx={{ width: "100%" }}></Box>
      )}
      {loading ? (
        <div className="spinner">
          <svg
            className="pl"
            viewBox="0 0 64 64"
            width="64px"
            height="64px"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000" />
                <stop offset="100%" stopColor="#fff" />
              </linearGradient>
              <mask id="grad-mask">
                <rect x="0" y="0" width="64" height="64" fill="url(#grad)" />
              </mask>
            </defs>
            <circle
              className="pl__ring"
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="hsl(223,90%,55%)"
              strokeWidth="12"
              strokeDasharray="169.65 169.65"
              strokeDashoffset="-127.24"
              strokeLinecap="round"
              transform="rotate(135)"
            />
            <g fill="hsl(223,90%,55%)">
              <circle
                className="pl__ball1"
                cx="32"
                cy="45"
                r="6"
                transform="rotate(14)"
              />
              <circle
                className="pl__ball2"
                cx="32"
                cy="48"
                r="3"
                transform="rotate(-21)"
              />
            </g>
            <g mask="url(#grad-mask)">
              <circle
                className="pl__ring"
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="hsl(283,90%,55%)"
                strokeWidth="12"
                strokeDasharray="169.65 169.65"
                strokeDashoffset="-127.24"
                strokeLinecap="round"
                transform="rotate(135)"
              />
              <g fill="hsl(283,90%,55%)">
                <circle
                  className="pl__ball1"
                  cx="32"
                  cy="45"
                  r="6"
                  transform="rotate(14)"
                />
                <circle
                  className="pl__ball2"
                  cx="32"
                  cy="48"
                  r="3"
                  transform="rotate(-21)"
                />
              </g>
            </g>
          </svg>
        </div>
      ) : null}

      <ToastContainer
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={false}
        theme="light"
      />
      <nav className="top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button
                data-drawer-target="logo-sidebar"
                data-drawer-toggle="logo-sidebar"
                aria-controls="logo-sidebar"
                type="button"
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                  ></path>
                </svg>
              </button>
              <a href="https://flowbite.com" className="flex ml-2 md:mr-24">
                <img
                  src="https://flowbite.com/docs/images/logo.svg"
                  className="h-8 mr-3"
                  alt="FlowBite Logo"
                />
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                  ChatGPT
                </span>
              </a>
            </div>
          </div>
        </div>
      </nav>
      <div className="grid grid-cols-8">
        <aside
          id="logo-sidebar"
          className="col-span-2 top-0 left-0 z-40 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
          aria-label="Sidebar"
        >
          <div className=" px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <TabList
                  onChange={handleTabChange}
                  aria-label="lab API tabs example"
                >
                  <Tab label="Training" value="training" />
                  <Tab label="Prompt" value="prompt" />
                </TabList>
              </Box>
              <TabPanel value="training">
                <FilePreviewer
                  handlestate={handleembedding}
                  handleDocstate={false}
                />
              </TabPanel>
              <TabPanel value="prompt">
                <div>
                  <FormGroup>
                    <FormControl sx={{ m: 1, width: "100%" }} size="large">
                      <InputLabel id="demo-select-small-label">
                        Audience
                      </InputLabel>
                      <Select
                        labelId="demo-select-small-label"
                        id="demo-select-small"
                        value={formValues.audience}
                        label="Audience"
                        onChange={handleAudienceChange}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {audiencedata.map((item, index) => {
                          return (
                            <MenuItem key={index} value={item}>
                              {item}
                            </MenuItem>
                          );
                        })}
                        <Divider />
                        <div className="flex justify-around px-[10px]">
                          <div class="w-full mr-[15px]">
                            <input
                              type="text"
                              id="audience"
                              placeholder="Please enter item"
                              onChange={handleSelect}
                              class="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            id="audience"
                            onClick={handleAddOption}
                            className="w-[30%] flex justify-center items-center"
                          >
                            <svg
                              viewBox="64 64 896 896"
                              focusable="false"
                              data-icon="plus"
                              width="1em"
                              height="1em"
                              fill="currentColor"
                              aria-hidden="true"
                              className="mr-[6px]"
                            >
                              <defs>
                                <style></style>
                              </defs>
                              <path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path>
                              <path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path>
                            </svg>
                            Add Audience
                          </button>
                        </div>
                      </Select>
                    </FormControl>
                    <FormControl sx={{ m: 1, width: "100%" }} size="large">
                      <InputLabel id="demo-select-small-label">
                        Purpose
                      </InputLabel>
                      <Select
                        labelId="demo-select-small-label"
                        id="demo-select-small"
                        value={formValues.purpose}
                        label="Purpose"
                        onChange={handlePurposeChange}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {purposedata.map((item, index) => {
                          return (
                            <MenuItem key={index} value={item}>
                              {item}
                            </MenuItem>
                          );
                        })}
                        <Divider />
                        <div className="flex justify-around px-[10px]">
                          <div class="w-full mr-[15px]">
                            <input
                              type="text"
                              id="purpose"
                              placeholder="Please enter item"
                              onChange={handleSelect}
                              class="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            id="purpose"
                            onClick={handleAddOption}
                            className="w-[30%] flex justify-center items-center"
                          >
                            <svg
                              viewBox="64 64 896 896"
                              focusable="false"
                              data-icon="plus"
                              width="1em"
                              height="1em"
                              fill="currentColor"
                              aria-hidden="true"
                              className="mr-[6px]"
                            >
                              <defs>
                                <style></style>
                              </defs>
                              <path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path>
                              <path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path>
                            </svg>
                            Add Purpose
                          </button>
                        </div>
                      </Select>
                    </FormControl>
                    <FormControl sx={{ m: 1, width: "100%" }} size="large">
                      <InputLabel id="demo-select-small-label">
                        Intention
                      </InputLabel>
                      <Select
                        labelId="demo-select-small-label"
                        id="demo-select-small"
                        value={formValues.intention}
                        label="Intention"
                        onChange={handleIntentionChange}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {intentiondata.map((item, index) => {
                          return (
                            <MenuItem key={index} value={item}>
                              {item}
                            </MenuItem>
                          );
                        })}
                        <Divider />
                        <div className="flex justify-around px-[10px]">
                          <div class="w-full mr-[15px]">
                            <input
                              type="text"
                              id="intention"
                              placeholder="Please enter item"
                              onChange={handleSelect}
                              class="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            id="intention"
                            onClick={handleAddOption}
                            className="w-[30%] flex justify-center items-center"
                          >
                            <svg
                              viewBox="64 64 896 896"
                              focusable="false"
                              data-icon="plus"
                              width="1em"
                              height="1em"
                              fill="currentColor"
                              aria-hidden="true"
                              className="mr-[6px]"
                            >
                              <defs>
                                <style></style>
                              </defs>
                              <path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path>
                              <path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path>
                            </svg>
                            Add Intention
                          </button>
                        </div>
                      </Select>
                    </FormControl>
                    <button
                      onClick={handleSubmit}
                      className="my-5 flex justify-center items-center bg-blue-500 text-gray-100 p-4  rounded-full tracking-wide uppercase
                                    font-semibold  focus:outline-none focus:shadow-outline hover:bg-blue-600 shadow-lg cursor-pointer transition ease-in duration-300"
                    >
                      <svg
                        width="24"
                        height="24"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-[10px]"
                      >
                        {" "}
                        <path
                          d="M3 19V5C3 3.89543 3.89543 3 5 3H16.1716C16.702 3 17.2107 3.21071 17.5858 3.58579L20.4142 6.41421C20.7893 6.78929 21 7.29799 21 7.82843V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />{" "}
                        <path
                          d="M8.6 9H15.4C15.7314 9 16 8.73137 16 8.4V3.6C16 3.26863 15.7314 3 15.4 3H8.6C8.26863 3 8 3.26863 8 3.6V8.4C8 8.73137 8.26863 9 8.6 9Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />{" "}
                        <path
                          d="M6 13.6V21H18V13.6C18 13.2686 17.7314 13 17.4 13H6.6C6.26863 13 6 13.2686 6 13.6Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />{" "}
                      </svg>
                      Save Prompt
                    </button>
                  </FormGroup>
                </div>
              </TabPanel>
            </TabContext>
          </div>
        </aside>

        <div className="col-span-6 p-4">
          <div className="rounded-b-lg border overflow-auto ">
            <div id="chat" className="overflow-auto h-[770px] ">
              {data.map((item, index) => {
                return (
                  <>
                    <div className="bg-[#dfe0f1] w-full text-[20px] p-[15px] flex">
                      <img
                        src="./human.png"
                        className="w-[32px] h-[32px] mr-[8px]"
                      />
                      {item.Human}
                    </div>
                    <div className="bg-[#f7f0f0] w-full text-[20px] p-[15px] flex">
                      <img
                        src="./bot.png"
                        className="w-[32px] h-[32px] mr-[8px]"
                      />
                      {item.Bot}
                    </div>
                  </>
                );
              })}
            </div>
            <div className="flex flex-row items-center h-16 rounded-xl bg-white w-full px-4">
              <div className="flex-grow ml-4">
                <div className="relative w-full">
                  <input
                    type="text"
                    className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    value={prompt}
                    placeholder="Write question..."
                  />
                  <button className="absolute flex items-center justify-center w-12 right-0 top-0 text-gray-400 hover:text-gray-600"></button>
                </div>
              </div>

              <div className="ml-4">
                <button
                  className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-1 flex-shrink-0"
                  onClick={handleChat}
                >
                  <span>Send</span>
                  <span className="ml-2">
                    <svg
                      className="w-4 h-4 transform rotate-45 -mt-px"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      ></path>
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
