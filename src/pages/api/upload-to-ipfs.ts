import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import formidable from 'formidable'
import fs from 'fs'
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Configure formidable. The `multiples` option can be enabled if you expect multiple files.
  const form = formidable({ multiples: true })

  try {
    // Parse the incoming request containing the form data
    const [fields, files] = await form.parse(req)

    // Assuming the file input name is 'file'. Depending on your form setup, the file may be
    // an array (if multiple files are allowed) or a single object.
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // --- Begin File Validation ---

    // 1. Validate file type. For PNG, we expect the MIME type to be 'image/png'
    // Some clients may not send the correct mimetype, so you could also check the file extension if needed.
    if (uploadedFile.mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Only PNG files are allowed' })
    }

    // 2. Validate file size. Ensure file is 1 MB (1 * 1024 * 1024 bytes) or less.
    const maxSize = 1 * 1024 * 1024 // 1 MB in bytes
    if (uploadedFile.size > maxSize) {
      return res.status(400).json({ error: 'File size must not exceed 1MB' })
    }

    // --- End File Validation ---

    // Read the file content from the temporary file path
    const fileContent = await fs.promises.readFile(uploadedFile.filepath)

    // Prepare form data for the API upload
    const formData = new FormData()
    formData.append(
      'file',
      new Blob([fileContent]),
      uploadedFile.originalFilename || 'unnamed_file'
    )

    // Retrieve necessary API configuration from environment variables
    const apiKey = process.env.CHAINSAFE_API_KEY
    const bucketId = process.env.CHAINSAFE_BUCKET_ID

    if (!apiKey || !bucketId) {
      console.error('Missing API key or bucket ID')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Upload the file to the external service (IPFS via ChainSafe)
    const response = await axios.post(
      `https://api.chainsafe.io/api/v1/bucket/${bucketId}/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    // Check if the response contains the expected file details
    if (response.data.files_details && response.data.files_details.length > 0) {
      const cid = response.data.files_details[0].cid
      const url = `https://ipfs-chainsafe.dev/ipfs/${cid}`
      return res.status(200).json({ url })
    } else {
      return res.status(500).json({ error: 'No CID found in the response' })
    }
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data)
      return res.status(error.response?.status || 500).json({
        error: error.response?.data || 'Failed to upload image to IPFS',
      })
    } else {
      return res.status(500).json({ error: 'Failed to upload image to IPFS' })
    }
  }
}