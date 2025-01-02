import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import request from 'request';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 9090;

// Directories
const outputDir = path.join(__dirname, 'output');
const fontsDir = path.join(__dirname, 'fonts');
const tempDir = path.join(__dirname, 'temp');

// Ensure directories exist
[outputDir, fontsDir, tempDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    endpoints: {
      health: '/health',
      extract: '/extract',
      generateVideo: '/generate-video',
      proxy: '/proxy',
    },
  });
});

const cleanup = (files) => {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    }
  });
};

async function downloadImage(url, outputPath) {
  try {
    const response = await axios({
      url,
      responseType: 'stream',
      timeout: 15000,
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

app.post('/extract', async (req, res) => {
  const { url } = req.body;

  //  const browser = await puppeteer.launch({
  //   args: [
  //     "--disable-setuid-sandbox",
  //     "--no-sandbox",
  //     "--single-process",
  //     "--no-zygote",
  //   ],
  //   executablePath:
  //     process.env.NODE_ENV === "production"
  //       ? process.env.PUPPETEER_EXECUTABLE_PATH
  //       : puppeteer.executablePath(),
  // });


  let browser = null;

  try {
   browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    const result = await page.evaluate(() => {
      const image = document.querySelector('a.single.singleC img');
      const imageSrc = image ? image.src : null;

      const rightDiv = document.querySelector('div.right');
      const pTags = rightDiv ? rightDiv.querySelectorAll('h1,p') : [];
      const pTexts = Array.from(pTags).map((p) => p.innerText.trim());

      return { imageSrc, pTexts };
    });

    if (!result.imageSrc) {
      throw new Error('No image found on the page');
    }

    res.json(result);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.post('/generate-video', async (req, res) => {
  const { imageSrc, pTexts } = req.body;
  const timestamp = Date.now();
  const imagePath = path.join(tempDir, `image-${timestamp}.png`);
  const videoFilePath = path.join(outputDir, `output_video-${timestamp}.mp4`);

  try {
    await downloadImage(imageSrc, imagePath);

    ffmpeg.setFfmpegPath(ffmpegPath);

    const ffmpegCommand = ffmpeg()
      .addInput(imagePath)
      .loop(5)
      .outputOptions('-pix_fmt yuv420p')
      .size('1280x720')
      .output(videoFilePath)
      .on('end', () => {
        console.log('Video created successfully');
        res.sendFile(videoFilePath, (err) => {
          if (err) {
            console.error('Error sending video file:', err);
            res.status(500).json({ error: 'Error sending video file' });
          }

          setTimeout(() => cleanup([imagePath, videoFilePath]), 1000);
        });
      })
      .on('error', (error) => {
        console.error('Error during video creation:', error);
        cleanup([imagePath, videoFilePath]);
        res.status(500).json({ error: error.message });
      });

    ffmpegCommand.run();
  } catch (error) {
    console.error('Video generation error:', error);
    cleanup([imagePath, videoFilePath]);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/proxy', (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send('Image URL is required');
  }

  request
    .get(imageUrl)
    .on('error', (err) => {
      console.error(err);
      res.status(500).send('Error fetching image');
    })
    .pipe(res);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
