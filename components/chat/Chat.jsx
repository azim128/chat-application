"use client"
import React, { useState, useRef, useEffect } from "react";
import Styles from "./chat.module.css";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Linkify from "react-linkify";
import { MdKeyboardVoice } from "react-icons/md";
import { AiTwotoneStop } from "react-icons/ai";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { speak, speakInEnglish, stopTalking } from "./speechHandler";



const devUrl = `http://localhost:5005`;
const prodUrl = `http://18.136.177.139:5005`;
const API_BASE_URL = process.env.NODE_ENV === "development" ? prodUrl : prodUrl;

const Axios = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Access-Control-Allow-Credentials": true,
    "Content-Type": "application/json",
  },
});

const getResponse = (msg, language) =>
  Axios.post("/webhooks/rest/webhook", {
    sender: "user1",
    message: msg,
    language,
  });

const Chat = () => {
  const boxRef = useRef();
  const [open, setOpen] = useState(false);

  const [currentInput, setCurrentInput] = useState("");

  const [received, setReceived] = useState([""]);
  
  const [messages, setMessages] = useState([
    {
      text: "হ্যালো! আমি হিয়া। আমি রবির ভার্চুয়াল এআই এসিস্ট্যান্ট। আমাকে রবির সেবা সম্বন্ধে যাবতীয় প্রশ্ন করতে পার।",
      type: 1,
      id: uuidv4(),
    },
  ]);
  const [currentReceived, setCurrentReceived] = useState([]);
  const [speechOpts, setSearchOpts] = React.useState({ language: "bn-BD" });
  const [didstopped, setDidStopped] = useState(false);
  const [rtt, setRtt] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [lang, setLanguage] = React.useState("bn");

  const { transcript, resetTranscript, finalTranscript, listening } = useSpeechRecognition();

  useEffect(() => {
    if (listening === false) {
      if (transcript && !didstopped) {
        setMessages([...messages, { text: transcript, type: 0, id: uuidv4() }]);
        getMsg(transcript);
      }
    }

    if (listening === true) setDidStopped(false);
  }, [listening]);

  useEffect(() => {
    setRtt(open ? 1 : 0);
  }, [open]);

  useEffect(() => {
    const l = received.length;
    if (received[l - 1]) {
      const rData = currentReceived?.map(item => ({ text: item, type: 1, id: uuidv4() }));

      // setMessages([...messages, { text: received[l - 1], type: 1, id: uuidv4() }]);
      setMessages([...messages, ...rData]);
    }
  }, [received.length]);

  useEffect(() => {
    if (open) {
      const objDiv = boxRef.current;
      objDiv.scrollTop = objDiv.scrollHeight;
    }
  }, [messages.length]);

  const getMsg = (msg) => {
    getResponse(msg, lang).then((res) => {
      // const { speakable, raw, intent } = res.data;
      // console.log("response====================");
      // console.log(res.data);
      let raw = [];
      if (res.data?.length) {
        raw = res.data.map(item => item.text)
      }

      const { intent } = res.data;
      const speakable = raw.join();
      if (intent === "bangla_language") {
        setLanguage("bn");
        setSearchOpts({ language: "bn-BD" });
      }

      if (intent == "english_language") {
        setLanguage("en");
        setSearchOpts({ language: "en-US" });
      }

      // setReceived([...received, raw]);
      
      setCurrentReceived(raw);
      setReceived([...received, ...raw]);

      if (lang === "bn") speak(speakable);
      else speakInEnglish(speakable);
    });
  };

  const handleInput = async (e) => {
    if (e) e.preventDefault();

    if (currentInput) {
      setMessages([...messages, { text: currentInput, type: 0, id: uuidv4() }]);

      getMsg(currentInput);
      setCurrentInput("");
    }
  };

  const handleChange = (e) => {
    setCurrentInput(e.target.value);
  };

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleListenStop = async () => {
    SpeechRecognition.stopListening();
    if (transcript) {
      setMessages([...messages, { text: transcript, type: 0, id: uuidv4() }]);
    }

    setDidStopped(true);
  };

  const handleListenStart = async () => {
    try {
      // Request microphone permission using the WebRTC API.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      // Permission granted, you can now start listening.
      SpeechRecognition.startListening(speechOpts);
    } catch (error) {
      // Permission denied or an error occurred.
      console.error('Error accessing the microphone:', error);
    }
  };

  return (
    <div className={Styles.container}>
      {open ? (
        <div className={Styles.chatBox}>
          <div className={Styles.chatTitle}>
            SENSEBOT <div className={Styles.sub}>Try out now</div>
          </div>
          <div className={Styles.chatMessage} ref={boxRef}>

            {messages.map((msg) => {
              return (
                <div className={msg.type === 0 ? Styles.sentMessage : Styles.receivedMessage} key={msg.id}>
                  <Linkify>
                    <div className="theChatMsg" dangerouslySetInnerHTML={{ __html: msg.text }} />
                    {msg.type === 1 && (
                      <button
                        style={{
                          border: 0,
                          margin: 0,
                          paddingTop: 5,
                          background: "transparent",
                          color: "gray",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        onClick={stopTalking}
                      >
                        Stop Talking
                      </button>
                    )}

                  </Linkify>
                </div>
              );
            })}
          </div>
          <div className={Styles.chatInputContainer}>
            <form action="" onSubmit={handleInput} autoComplete="off">
              {/* {listening && <p className="chatInput">{transcript} [Listening...]</p>} */}
              <input
                type="text"
                name="chatInput"
                value={listening ? transcript : currentInput}
                placeholder="Type message here..."
                className={Styles.chatInput}
                onChange={handleChange}
              />
            </form>

            {listening ? (
              <button onClick={handleListenStop}>
                <AiTwotoneStop />
              </button>
            ) : (
              <button onClick={handleListenStart}>
                <MdKeyboardVoice />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={Styles.messageNow}>
          <div className={Styles.chatNowTitle}>
            <img
              src={"/logoOnly.jpg"}
              width={108}
              height={130}
              alt="sensebot-logo"
              className={open ? Styles.rtt : Styles.normal}
            />
          </div>
          <div className={Styles.chatNow} onClick={handleToggle}>
            Chat Now
          </div>
        </div>
      )}
      <div className={Styles.toggleButton}>
        <img src={"/chat.png"} width={50} height={50} alt="chat-icon" onClick={handleToggle} rtt={rtt} />
      </div>
    </div>
  );
};

export default Chat;
