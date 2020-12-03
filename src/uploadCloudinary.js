const multer = require('multer')
const stream = require('stream')
const cloudinary = require('cloudinary')
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECRET
});

if (!process.env.CLOUDINARY_URL) {
	process.env.CLOUDINARY_URL = CLOUDINARY_URL;
}

const doUpload = (publicId, req, res, next) => {
	const uploadStream = cloudinary.uploader.upload_stream(result => {
		req.fileurl = result.url
		req.fileid = result.public_id
		next()
	}, { public_id: req.body[publicId] })

	const s = new stream.PassThrough()
	s.end(req.file.buffer)
	s.pipe(uploadStream)
	s.on('end', uploadStream.end)
}

const uploadImage = (publicId) => (req, res, next) => {
	multer().single('text')(req, res, () => {
		if (req.body.text === undefined) {
			req.text = null;
		} else if (!req.body.text[0] || req.body.text[0] === 'undefined') {
			req.text = '';
		} else {
			req.text = req.body.text[0];
		}
	})

	multer().single('image')(req, res, () => {
		if (req.file === undefined) {
			req.file = null;
			next()
		}
		else {
			doUpload(publicId, req, res, next)
		}
	})
}

module.exports = uploadImage;