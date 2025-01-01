import React, { useState, useCallback,useRef } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";


const App = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [progress, setProgress] = useState(0);
  const [showPanel, setshowPanel] = useState(false)
  const [dataURL, setdataURL] = useState()
  const areaRef = useRef(null);
  const imageref = useRef(null)
  const [animate, setanimate] = useState(false)
  const [generatingVideobutton, setgeneratingVideobutton] = useState(false)






  const resetStates = useCallback(() => {
    setError("");
    setVideoURL("");
    setProgress(0);
  }, []);

  
  
  // Helper function to resize an image URL
  const resizeImage = (imgUrl, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
  
        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
  
        // Create a canvas for resizing
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
  
        // Draw the resized image on the canvas
        ctx.drawImage(img, 0, 0, width, height);
  
        // Convert the canvas to a resized image URL
        const resizedImgUrl = canvas.toDataURL("image/jpeg", 0.8); // Adjust quality if needed
        resolve(resizedImgUrl);
      };
  
      img.onerror = (error) => reject(error);
      img.src = imgUrl; // Set the image source to the screenshot URL
    });
  };

  const handleScreenshot = async () => {
    if (areaRef.current) {
      const rect = areaRef.current.getBoundingClientRect();
  
      // Define the specific width and height you want to capture
      const width = areaRef.current.offsetWidth;
      const height = areaRef.current.offsetHeight;
  
;
  
      // Inline all external images as Base64 to avoid CORS issues
      await inlineImages();
  
      // Take the screenshot with html2canvas
      html2canvas(document.body, {
        useCORS: true,
        x: rect.left, // X-coordinate of the element relative to the viewport
        y: rect.top, // Y-coordinate of the element relative to the viewport
        width: width, // Width of the screenshot area
        height: height, // Height of the screenshot area
        scrollX: 0, // Disable scrolling offset
        scrollY: -window.scrollY, // Account for page scroll position
      })
        .then((canvas) => {
          // Convert the canvas to an image
          const imgUrl = canvas.toDataURL();
  
          // Resize the generated image
          resizeImage(imgUrl, 1280, 720)
            .then((resizedImgUrl) => {
              // Do something with the resized image URL (e.g., send it through an API)
              console.log("Resized image URL:", resizedImgUrl);
              setdataURL(resizedImgUrl);
            })
            .catch((error) => {
              console.error("Error resizing image:", error);
            });
        })
        .catch((error) => {
          console.error("Error capturing screenshot:", error);
        });
    } else {
      console.log("Reference is null");
    }
  };
  
  // Helper Function to Inline External Images
  const inlineImages = async () => {
    const images = document.querySelectorAll("img");
  
    for (let img of images) {
      const src = img.src;
      if (src.startsWith("http")) {
        try {
          const base64 = await convertImageToBase64(src);
          img.src = base64; // Replace the image source with Base64
        } catch (err) {
          console.error("Failed to inline image:", src, err);
        }
      }
    }
  };
  
  // Convert Image URL to Base64
  const convertImageToBase64 = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Enables CORS handling
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });
  
  
  




  const generateVideo = async () => {
    setGeneratingVideo(true);
    resetStates();

    try {
      const { imageSrc, pTexts } = result;
      
      const response = await axios.post(
        'http://localhost:9090/generate-video',
        { imageSrc:dataURL, pTexts },
        { 
          responseType: 'blob',
          timeout: 60000,
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      );

      const videoBlob = new Blob([response.data], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      setVideoURL(videoUrl);

      // Auto download the video
      saveAs(videoBlob, `scraped_content_${Date.now()}.mp4`);
    } catch (error) {
      console.error("Video generation error:", error);
      setError("Failed to generate video. Please try again.");
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setgeneratingVideobutton(false)

    setLoading(true);
    setResult(null);
    resetStates();

    try {
      const response = await axios.post(
        "http://localhost:9090/extract",
        { url },
        {
          headers: {
            "Content-Type": "application/json",
          },
          // timeout: 30000
        }
      );

      if (response.data) {
        setResult(response.data);
      }
    } catch (err) {
      setError(`Failed to scrape data: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
      setshowPanel(true)
      setanimate(!animate)
      setTimeout(() => {
        handleScreenshot()

      }, 3000)
      setTimeout(() => {
        setgeneratingVideobutton(!generatingVideobutton)


      }, 5000)
    }
  };
  useGSAP(function () {
    if (animate) {
      gsap.to(imageref.current, {
        transform: 'translateY(0)',
        opacity: 1,
        duration: 2,
        ease: "power2.inOut",


      })
    }

    else {
      gsap.to(imageref.current, {
        transform: 'translateY(100%)',
        opacity: 0,
        duration: 1,
        ease: "power2.inOut"
      })
    }
  }, [animate])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Video Content Generator
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col space-y-4">
          <input
            type="url"
            placeholder="Enter URL to scrape"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className={`bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition-colors
              ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={loading}
          >
            {loading ? "Scraping Data..." : "Scrape Content"}
          </button>
        </div>
      </form>

      {error && (
        <div className="w-full max-w-2xl bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

{showPanel && (
        <div   className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto bg-slate-300 ">
          <div  className="fixed inset-0 bg-gray-900 opacity-75" onClick={() => { setshowPanel(false) ,
      setanimate(!animate)

          }} ></div>
          <div  className="relative bg-gradient-to-b from-yellow-300 to-yellow-200 px-4 py-2  rounded-lg  ">
            <div ref={areaRef} id="screen"  className="w-full max-w-2xl max-sm:h-1/2 max-lg:bg-yellow-300  bg-gradient-to-b from-yellow-300 to-yellow-200 rounded-lg  overflow-y-auto "
            >

              {/* <h2 className="text-xl font-semibold mb-4  text-center">Extracted Information</h2> */}
              <div  className=" bg-cover scale-x-125 m-2 scale-y-125 object-cover bg-left-top-bottom bg-no-repeat bg-opacity-0 absolute size-full  "
                style={{
                  opacity: 0.1,
                  backgroundImage: '   url("https://www.klotzetechnic.de/assets/img/logo-b.png")'
                }}>
              </div>
              <div className="flex flex-col md:flex-row bg-gradient-to-b from-yellow-300 to-yellow-200 rounded-2xl shadow-lg overflow-hidden w-full">

                {/* Left Section - Image and Title */}
                <div

                  className="bg-gradient-to-b py-20 from-yellow-300 to-yellow-200 text-white flex flex-col justify-center items-center p-6 md:w-3/5">
                  {/* <h1 className="text-2xl font-bold mb-4 text-center text-blue-900">{result.pTexts[0]}</h1> */}
                  {result.imageSrc && (
                    <><img
                    ref={imageref}
                    src={result.imageSrc}
                    alt="Extracted"
                    className={`w-full bg-transparent   h-full object-fill max-md:size-96 translate-y-full opacity-0 `}
                  />
                  {/* <VideoGenerator imageUrl={result.imageSrc}/> */}
                  </>
                  )}
                  {/* <p className="mt-4 text-xs italic text-gray-200">
                Air Brake Systems and Repair Kits
              </p> */}
                  <img className="w-1/2 mt-3"  src="https://www.klotzetechnic.de/assets/img/logo-b.png" alt="" /> 
                </div>

                {/* Right Section - Details and CTAs */}
                <div className="p-6 items-center flex flex-col md:w-2/4 space-y-6 "
                >
                  {/* Product Info */}


                  <div className="space-y-4 relative  bg-opacity-0 "  >

                  <h1 className="text-3xl leading-tight p-4 font-bold  text-center text-blue-900">{result.pTexts[0]}</h1>


                    {
                      result.pTexts.length === 10 && <>
                     

                      <div className="flex gap-16  w-full " >
                        {/* //inner left  */}
                        <div className="relative">
                        <div className=" absolute  w-2 py-2 bg-blue-900 rounded-full px-0.5 flex flex-col gap-4 "> 
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                         
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          {/* <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div> */}

                         
                          </div>
                       
                        </div>
                        <div className="flex flex-col  gap-4">


                        <div className="flex px-4 py-1 gap-x-2 items-center  rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -mt-2 -ml-1 top-0 break-words">Klötze No:</p>
                          <p className="text-yellow-300 font-bold text-sm ">{result.pTexts[1].split('Klötze No:')}</p>
                        </div>
 
                        
 
                        <div className="flex px-4 py-2   leading-tight   gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">{result.pTexts[3]}</p>
                          <p className="text-yellow-300 font-bold text-[10px] break-words leading-tight ">{result.pTexts[4]}</p>
                        </div>
                        
                        
                       <div className="flex px-4 py-2   leading-tight  gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">Weight:</p>
                          <p className="text-yellow-300 font-bold text-[10px] break-words leading-tight ">{result.pTexts[7].split('Weight:')}</p>
                        </div>  
                        <div className="flex px-4 py-2   leading-tight  gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">Package Unit:</p>
                          <p className="text-yellow-300 font-bold text-[10px] break-words leading-tight">{result.pTexts[8].split('Package Unit:')}</p>
                        </div> 

                        {/* <p className="text-blue-900 font-bold">{result.pTexts[5]}</p> */}
                        <div className="flex w-full items-center justify-between gap-2">
                          <p className="text-[6px] leading-tight text-gray-500">{result.pTexts[2]}</p>
                        </div> 

                      

                        {/* <p className="text-blue-900 font-bold ">{result.pTexts[6].split('Weight:')}</p> */}


                         
                        
                      </div>
                      </div>
                      </>
                    }
                    {
                      result.pTexts.length === 11 &&
                      <>
                      

                      <div className="flex gap-12  w-full " >
                        {/* //inner left  */}
                        <div className="relative">
                        <div className=" absolute  w-2 py-2 bg-blue-900 rounded-full px-0.5 flex flex-col gap-4 "> 
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          
                          {/* <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div> */}
                          {result.pTexts.length === 11 &&
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          }
                           {result.pTexts.length === 12 &&<>
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          </>
                         }

                          </div>
                       
                        </div>

                      <div className="flex flex-col gap-4" >




                        <div className="flex px-4 py-1   leading-tight 1 mt-2 gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">Klötze No:</p>
                          <p className="text-yellow-300 font-bold text-[12px] break-words leading-tight">{result.pTexts[1].split('Klötze No:')}</p>
                        </div>

                        

                        <div className="flex px-4 py-2   leading-tight 1  gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">{result.pTexts[3]}</p>
                          <p className="text-yellow-300 font-bold text-[12px] break-words leading-tight ">{result.pTexts[4]}</p>
                        </div>

                        <div className="flex px-4 py-2   leading-tight 1  gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">{result.pTexts[5]}</p>
                          <p className="text-yellow-300 font-bold text-[12px] break-words leading-tight ">{result.pTexts[6]}</p>
                        </div>

                        {/* <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0 ">{result.pTexts[7]}</p> */}

{/* 
                        <div className="flex px-4 py-2   leading-tight 1 mt-1 gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">Weight:</p>
                        
                          <p className="text-yellow-300 font-bold text-[10px] break-words leading-tight  ">{result.pTexts[8].split('Weight:')}</p>
                        </div>
                        <div className="flex px-4 py-2   leading-tight 1 mt-1 gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">Package Unit:</p>
                         
                          <p className="text-yellow-300 font-bold text-[10px] break-words leading-tight  ">{result.pTexts[9].split('Package Unit:')}</p>
                        </div> */}
                        <div className="flex w-full items-center justify-between gap-2">
                          <p className="text-[7px] leading-tight text-gray-500">{result.pTexts[2]}</p>
                        </div> 
                      </div>
                      </div>
                      </>
                    }
                    {
                      result.pTexts.length === 12 &&
                      <>
                      <div className="flex gap-12  w-full " >
                        {/* //inner left  */}
                        <div className="relative">
                        <div className=" absolute  w-2 py-2 bg-blue-900 rounded-full px-0.5 flex flex-col gap-4 "> 
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          {/* <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div> */}
                          {result.pTexts.length === 11 &&
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          }
                           {result.pTexts.length === 12 &&<>
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          <div className="bg-white rounded-tl-full rounded-bl-full rounded-tr-full rounded-b-3xl -rotate-45 size-6 p-2 -ml-2 border-blue-900 border-4"></div>
                          </>
                         }

                          </div>
                       
                        </div>
                      <div className="flex flex-col justify-between gap-2" >




                        <div className="flex px-4 py-1   leading-tight 1 mt-1 gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">Klötze No:</p>
                          <p className="text-yellow-300 font-bold text-[12px] break-words leading-tight ">{result.pTexts[1].split('Klötze No:')}</p>
                        </div>

                        

                        <div className="flex px-4 py-2   leading-tight 1 mt-1 gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">{result.pTexts[3]}</p>
                          <p className="text-yellow-300 font-bold text-[12px] break-words leading-tight ">{result.pTexts[4]}</p>
                        </div>

                        <div className="flex px-4 py-2   leading-tight 1 mt-1 gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">{result.pTexts[5]}</p>
                          <p className="text-yellow-300 font-bold text-[12px] break-words leading-tight ">{result.pTexts[6]}</p>
                        </div>

                        <div className="flex px-4 py-2   leading-tight 1 mt-1 gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">{result.pTexts[7]}</p>
                          <p className="text-yellow-300 font-bold text-[12px] break-words leading-tight ">{result.pTexts[8]}</p>
                        </div>



                        {/* <div className="flex px-4 py-2   leading-tight 1 mt-1 gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">Weight:</p>
                    
                          <p className="text-blue-900 font-bold ">{result.pTexts[9].split('Weight:')}</p>
                        </div>
                        <div className="flex px-4 py-2   leading-tight 1 mt-1 gap-x-2 items-center   rounded-3xl  bg-blue-900">
                          <p className="text-yellow-300 text-[8px] font-semibold -ml-1 top-0">Package Unit:</p>
                         
                          <p className="text-blue-900 font-bold ">{result.pTexts[10].split('Package Unit:')}</p>
                        </div> */}
                        <div className="flex w-full items-center justify-between gap-2">
                          <p className="text-[8px] leading-tight text-gray-500">{result.pTexts[2]}</p>
                        </div> 
                      </div>
                      </div>
</>

                    }






                    {/* {result.pTexts && result.pTexts.map((text, index) => (
                  <div className="flex justify-between" key={index}>
                    <p className="text-sm font-semibold text-gray-600">Detail {index + 1}:</p>
                    <p className="text-blue-900 font-bold">{text}</p>
                  </div>
                ))} */}
                  </div>

                  {/* Information Note */}
                  <div className=" flex ml-10 flex-1 right-0  flex-col items-center justify-end gap-5">
                  <p className="text-xs leading-tight text-gray-500 break-words ">
                    O.E.M. NUMBERS AND TRADEMARKS ARE STATED FOR COMPARISON ONLY
                  </p>

                  {/* Buttons */}
                  <div className="flex  ">
                    <a
                      href={url}
                      target="blank"
                      className="bg-blue-900  text-yellow-300 px-6 py-2 rounded-lg font-bold shadow-xl text-sm hover:bg-yellow-300 transition"
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
            </div>

            {generatingVideobutton && (
            <button
              onClick={generateVideo}
              className="mt-4 z-10  bg-green-500 absolute text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors w-full"
              disabled={generatingVideo}
            >
              Generate Video
            </button>
          )}
           {generatingVideo && (
        <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-blue-600">Generating video... {progress}%</p>
          </div>
        </div>
      )}


          </div>
         
          
          </div>
         



      )}
       

     

      {videoURL && (
        <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Generated Video</h2>
          <video 
            controls 
            className="w-full rounded-md shadow-sm mb-4"
            src={videoURL}
          >
            Your browser does not support the video tag.
          </video>
          <button
            onClick={() => {
              const videoBlob = new Blob([videoURL], { type: 'video/mp4' });
              saveAs(videoBlob, `scraped_content_${Date.now()}.mp4`);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors w-full"
          >
            Download Video Again
          </button>
        </div>
      )}
      {
        dataURL &&
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Recorded Video:</h3>
          <img src={dataURL}
            // src={videoURL}
            // controls
            className="w-full max-w-md border rounded-lg object-contain"
          />
        </div>
      }
    </div>
  );
};

export default App;