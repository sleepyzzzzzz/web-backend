const multer = require('multer')
const stream = require('stream')
const cloudinary = require('cloudinary')
const CLOUDINARY_URL = "cloudinary://775497117339581:Kv1FwQqrkM0OGxpT8r4Eewwo6Rg@hrjpmneev";
cloudinary.config({
	cloud_name: 'hrjpmneev',
	api_key: '775497117339581',
	api_secret: 'Kv1FwQqrkM0OGxpT8r4Eewwo6Rg'
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

const uploadImage = (publicId) => (req, res, next) =>
	multer().single('image')(req, res, () =>
		doUpload(publicId, req, res, next))


module.exports = uploadImage;

