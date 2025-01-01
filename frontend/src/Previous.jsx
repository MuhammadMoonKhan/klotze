import React, { useState,useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";



const App = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const areaRef = useRef(null);
  const imageref = useRef(null)
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState("");
  const [showPanel, setshowPanel] = useState(false)
  const [dataURL, setdataURL] = useState()
  const [animate, setanimate] = useState(false)


  // const areaRef = useRef(null); // Reference to the area to capture

  const handleScreenshot = () => {
    if (areaRef.current) {
      // Get the bounding rectangle of the element
      const rect = areaRef.current.getBoundingClientRect();
      
      // Define the specific width and height you want to capture
      const width = 680; // Set your desired width
      const height = 650; // Set your desired height
      console.log(rect.top , 'x',  rect.left  )
      
      // Specify the offset and dimensions for the screenshot
      html2canvas(areaRef.current, {
        x: 510, // X-coordinate of the element
        y: 60,  // Y-coordinate of the element
        width: width, // Width of the screenshot area
        height: height, // Height of the screenshot area
        scrollX: 0, // Disable scrolling offset
        scrollY: -window.scrollY, // Account for page scroll position
      }).then((canvas) => {
        // Convert the canvas to an image and do something with it
        const imgUrl = canvas.toDataURL();

        
      
        // Or download the screenshot
        setdataURL(imgUrl)
        // const link = document.createElement("a");
        // link.href = imgUrl;
        // link.download = "screenshot.png";
        // link.click();
      }).catch((error) => {
        console.error("Error capturing screenshot:", error);
      });
    } else {
      console.log("Reference is null");
    }
  };





  const startRecording = async () => {
    try {
      // Use getDisplayMedia to capture the screen
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9",
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoURL(url);
        stream.getTracks().forEach((track) => track.stop()); // Stop all tracks
      };

      mediaRecorder.start();
      setRecording(true);

      // Stop recording after 5 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        setRecording(false);
      }, 5000); // Change duration as needed
    } catch (err) {
      console.error("Error accessing screen recording:", err);
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    

    try {
      const response = await axios.post("http://localhost:9090/extract", { url }, {

        headers: {
          "Content-Type": "application/json",
        },


      });


      if (!response) {
        throw new Error("Failed to fetch data from the server.");
      }


      setResult(response.data);
      console.log("Are you sure you want to", response)
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setshowPanel(true)
      setanimate(true)

      // startRecording()
      // captureScreenshot()
      setTimeout(()=>{
      handleScreenshot()

      }, 2000)
    }
  };
  const WaitingForDriverref = useRef(null)
  


  useGSAP(function(){
    if(animate){
        gsap.to(imageref.current, {       
      transform:'translateY(0)',
      opacity:1,
      duration:2,
      ease: "power2.inOut",
      
  
    })
    }
    
    else{
      gsap.to(imageref.current, { 
        transform:'translateY(100%)',
        opacity:0,
        duration:1,
      ease: "power2.inOut"
      })    
    }
      },[animate])
 


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Product Information Extractor</h1>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-6 rounded-lg shadow-md"
      >
        <label
          htmlFor="url"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Enter Product URL:
        </label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a valid URL"
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-200"
        />
        <button
          type="submit"
          className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 "
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>

      {/* Output Section */}
      {error && (
        <div className="text-red-500 mt-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      {showPanel && (
       <div ref={areaRef} id="screen" className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto bg-slate-300 ">
            <div className="fixed inset-0 bg-gray-900 opacity-75" onClick={()=>{setshowPanel(false), setanimate(false)}} ></div>
            <div className="relative bg-white rounded-lg shadow-lg overflow-y-auto">
            <div  className="w-full max-w-2xl max-sm:h-1/2 max-lg:bg-yellow-300 mt-6 p-4 bg-yellow-300 rounded-lg shadow-md overflow-y-auto "
       >
          <h2 className="text-xl font-semibold mb-4  text-center">Extracted Information</h2>

          <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg overflow-hidden w-full">
            {/* Left Section - Image and Title */}
            <div 
            
            className="bg-blue-900 text-white flex flex-col justify-center items-center p-6 md:w-1/2">
              <h1 className="text-2xl font-bold mb-4 text-center">{result.pTexts[0]}</h1>
              {result.imageSrc && (
                <img
                ref={imageref}
                  src={result.imageSrc}
                  alt="Extracted"
                  className={`w-60 h-60 object-cover max-md:size-96 translate-y-full opacity-0 `}
                />
              )}
              {/* <p className="mt-4 text-xs italic text-gray-200">
                Air Brake Systems and Repair Kits
              </p> */}
              <img className="w-1/2 mt-3"  src="https://www.klotzetechnic.de/assets/img/logo-b.png" alt="" />
            </div>

            {/* Right Section - Details and CTAs */}
            <div className="p-6 items-center flex flex-col md:w-1/2 space-y-6 "
            >
              {/* Product Info */}

                <div className="space-y-4 relative bg-cover bg-opacity-0 "  >
                 
          
                {
                  result.pTexts.length === 10 &&
                  <div className="flex flex-col justify-between gap-2" >
                     <div  className="space-y-4 bg-cover bg-left-bottom bg-no-repeat bg-opacity-0 absolute w-full h-[100%] "
                  style={{
                    opacity:0.1,
            backgroundImage: '   url("https://www.klotzetechnic.de/assets/img/logo-b.png")'
          }}>
                    </div>




                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">Klötze No:</p>
                      <p className="text-blue-900 font-bold">{result.pTexts[1].split('Klötze No:')}</p>
                    </div>

                    <div className="flex w-full items-center justify-between gap-2">
                      {/* <p className="text-blue-900 font-bold">Des: </p> */}
                      <p className="text-xs text-gray-500">{result.pTexts[2]}</p>
                    </div>

                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">{result.pTexts[3]}</p>
                      <p className="text-blue-900 font-bold">{result.pTexts[4]}</p>
                    </div>
                    <p className="text-blue-900 font-bold">{result.pTexts[5]}</p>
                    {/* <p className="text-blue-900 font-bold">{result.pTexts[6]}</p> */}

                    <p className="text-blue-900 font-bold ">{result.pTexts[6].split('Weight:')}</p>


                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">Weight:</p>
                      {/* <p className="text-blue-900 font-bold ">{result.pTexts[7].split('Weight:')}</p> */}
                      <p className="text-blue-900 font-bold ">{result.pTexts[7].split('Weight:')}</p>
                    </div>
                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">Package Unit:</p>
                      {/* <p className="text-blue-900 font-bold ">{result.pTexts[7].split('Weight:')}</p> */}
                      <p className="text-blue-900 font-bold ">{result.pTexts[8].split('Package Unit:')}</p>
                    </div>
                  </div>
                }
                {
                  result.pTexts.length === 11 &&
                  <div className="flex flex-col justify-between gap-2" >




                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">Klötze No:</p>
                      <p className="text-blue-900 font-bold">{result.pTexts[1].split('Klötze No:')}</p>
                    </div>

                    <div className="flex w-full items-center justify-between gap-2">
                      {/* <p className="text-blue-900 font-bold">Des: </p> */}
                      <p className="text-xs text-gray-500">{result.pTexts[2]}</p>
                    </div>

                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">{result.pTexts[3]}</p>
                      <p className="text-blue-900 font-bold">{result.pTexts[4]}</p>
                    </div>

                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">{result.pTexts[5]}</p>
                      <p className="text-blue-900 font-bold">{result.pTexts[6]}</p>
                    </div>

                    <p className="text-blue-900 font-bold ">{result.pTexts[7]}</p>


                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">Weight:</p>
                      {/* <p className="text-blue-900 font-bold ">{result.pTexts[7].split('Weight:')}</p> */}
                      <p className="text-blue-900 font-bold ">{result.pTexts[8].split('Weight:')}</p>
                    </div>
                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">Package Unit:</p>
                      {/* <p className="text-blue-900 font-bold ">{result.pTexts[7].split('Weight:')}</p> */}
                      <p className="text-blue-900 font-bold ">{result.pTexts[9].split('Package Unit:')}</p>
                    </div>
                  </div>
                }
                {
                  result.pTexts.length === 12 &&
                  <div className="flex flex-col justify-between gap-2" >




                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">Klötze No:</p>
                      <p className="text-blue-900 font-bold">{result.pTexts[1].split('Klötze No:')}</p>
                    </div>

                    <div className="flex w-full items-center justify-between gap-2">
                      {/* <p className="text-blue-900 font-bold">Des: </p> */}
                      <p className="text-xs text-gray-500">{result.pTexts[2]}</p>
                    </div>

                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">{result.pTexts[3]}</p>
                      <p className="text-blue-900 font-bold">{result.pTexts[4]}</p>
                    </div>

                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">{result.pTexts[5]}</p>
                      <p className="text-blue-900 font-bold">{result.pTexts[6]}</p>
                    </div>

                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">{result.pTexts[7]}</p>
                      <p className="text-blue-900 font-bold">{result.pTexts[8]}</p>
                    </div>



                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">Weight:</p>
                      {/* <p className="text-blue-900 font-bold ">{result.pTexts[7].split('Weight:')}</p> */}
                      <p className="text-blue-900 font-bold ">{result.pTexts[9].split('Weight:')}</p>
                    </div>
                    <div className="flex mt-2 gap-1 items-center justify-between">
                      <p className="text-blue-900 font-bold">Package Unit:</p>
                      {/* <p className="text-blue-900 font-bold ">{result.pTexts[7].split('Weight:')}</p> */}
                      <p className="text-blue-900 font-bold ">{result.pTexts[10].split('Package Unit:')}</p>
                    </div>
                  </div>
                }






                {/* {result.pTexts && result.pTexts.map((text, index) => (
                  <div className="flex justify-between" key={index}>
                    <p className="text-sm font-semibold text-gray-600">Detail {index + 1}:</p>
                    <p className="text-blue-900 font-bold">{text}</p>
                  </div>
                ))} */}
              </div>

              {/* Information Note */}
              <p className="text-xs text-gray-500">
                O.E.M. NUMBERS AND TRADEMARKS ARE STATED FOR COMPARISON ONLY
              </p>

              {/* Buttons */}
              <div className="flex align-middle   ">
                <a
                  href={url}
                  target="blank"
                  className="bg-yellow-400 items-center text-blue-900 px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-yellow-300 transition"
                >
                  Order Now
                </a>
                {/* <a
                  href="#"
                  className="bg-blue-900 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-800 transition"
                >
                  Go Back
                </a> */}
              </div>
            </div>
          </div>
        </div>
            
            
            
            </div></div>

      
      
      )}

{videoURL && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Recorded Video:</h3>
          <video
            src={videoURL}
            controls
            className="w-full max-w-md border rounded-lg"
          ></video>
        </div>
      )}
      {
        dataURL&&
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Recorded Video:</h3>
          <img src={dataURL}
            // src={videoURL}
            // controls
            className="w-full max-w-md border rounded-lg"
          />
        </div>
      }
    </div>
  );
};

export default App;
