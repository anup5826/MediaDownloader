from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from media.audio import process_audio
from media.video import process_video

import os
import uuid
import yt_dlp


app = Flask(__name__)

CORS(app)


@app.route("/")
def home():

    return jsonify({
        "status": "success",
        "message": "Media Downloader backend is running!"
    })


@app.route("/api/test")
def api_test():

    return jsonify({
        "status": "success",
        "message": "Frontend successfully connected to Flask!"
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "status": "error",
                "message": "No data received."
            }), 400

        url = data.get(
            "url",
            ""
        ).strip()

        if not url:

            return jsonify({
                "status": "error",
                "message": "URL is required."
            }), 400

        if not url.startswith(
            ("http://", "https://")
        ):

            return jsonify({
                "status": "error",
                "message": "Please enter a valid URL."
            }), 400

        format_type = data.get(
            "format",
            "video"
        ).lower()

        allowed_formats = [
            "audio",
            "video"
        ]

        if format_type not in allowed_formats:

            return jsonify({
                "status": "error",
                "message":
                    "Invalid format. Choose audio or video."
            }), 400


        # =========================
        # AUDIO PROCESSING
        # =========================

        if format_type == "audio":

            quality = data.get(
                "quality",
                "best"
            )

            processing_result = process_audio(
                quality
            )


        # =========================
        # VIDEO PROCESSING
        # =========================

        else:

            quality = data.get(
                "quality",
                "best"
            )

            processing_result = process_video(
                quality
            )


        # =========================
        # PROCESSING ERROR
        # =========================

        if processing_result.get(
            "status"
        ) == "error":

            return jsonify({
                "status": "error",
                "message":
                    processing_result.get(
                        "message",
                        "Processing error."
                    )
            }), 400


        # =========================
        # SUCCESS RESPONSE
        # =========================

        return jsonify({

            "status": "success",

            "message":
                "Request processed successfully.",

            "url":
                url,

            "format":
                format_type,

            "processing":
                processing_result

        })


    except Exception as error:

        print(
            "Error:",
            error
        )

        return jsonify({

            "status": "error",

            "message":
                "Something went wrong on the server."

        }), 500


# ==================================================
# DOWNLOAD REQUEST
# ==================================================

@app.route(
    "/api/download",
    methods=["POST"]
)
def download():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "status": "error",
                "message":
                    "No download data received."
            }), 400


        # =========================
        # GET DATA
        # =========================

        url = data.get(
            "url",
            ""
        ).strip()

        format_type = data.get(
            "format",
            "video"
        ).lower()

        quality = data.get(
            "quality",
            "best"
        ).lower()


        # =========================
        # URL VALIDATION
        # =========================

        if not url:

            return jsonify({
                "status": "error",
                "message":
                    "URL is required."
            }), 400


        if not url.startswith(
            ("http://", "https://")
        ):

            return jsonify({
                "status": "error",
                "message":
                    "Please enter a valid URL."
            }), 400


        # =========================
        # FORMAT VALIDATION
        # =========================

        if format_type not in [
            "audio",
            "video"
        ]:

            return jsonify({
                "status": "error",
                "message":
                    "Invalid format."
            }), 400


        # =========================
        # QUALITY VALIDATION
        # =========================

        if format_type == "audio":

            allowed_quality = [
                "best",
                "high",
                "medium"
            ]

        else:

            allowed_quality = [
                "best",
                "1080",
                "720",
                "480",
                "360"
            ]


        if quality not in allowed_quality:

            return jsonify({
                "status": "error",
                "message":
                    "Invalid quality for selected format."
            }), 400


        # =========================
        # DOWNLOAD FOLDER
        # =========================

        download_folder = os.path.join(
            app.root_path,
            "downloads"
        )

        os.makedirs(
            download_folder,
            exist_ok=True
        )


        # =========================
        # UNIQUE FILE NAME
        # =========================

        file_id = uuid.uuid4().hex


        # =========================
        # VIDEO SETTINGS
        # =========================

        if format_type == "video":

            if quality == "best":

                format_selector = (
                    "bestvideo+bestaudio/"
                    "best"
                )

            else:

                format_selector = (
                    f"bestvideo[height<={quality}]"
                    "+bestaudio/"
                    f"best[height<={quality}]"
                )


            output_template = os.path.join(
                download_folder,
                f"{file_id}.%(ext)s"
            )


            ydl_options = {

                "format":
                    format_selector,

                "outtmpl":
                    output_template,

                "noplaylist":
                    True,

                "quiet":
                    True,

                "no_warnings":
                    True

            }


        # =========================
        # AUDIO SETTINGS
        # =========================

        else:

            output_template = os.path.join(
                download_folder,
                f"{file_id}.%(ext)s"
            )


            ydl_options = {

                "format":
                    "bestaudio/best",

                "outtmpl":
                    output_template,

                "noplaylist":
                    True,

                "quiet":
                    True,

                "no_warnings":
                    True

            }


        # =========================
        # ACTUAL MEDIA DOWNLOAD
        # =========================

        try:

            with yt_dlp.YoutubeDL(
                ydl_options
            ) as ydl:

                info = ydl.extract_info(
                    url,
                    download=True
                )

                downloaded_file = (
                    ydl.prepare_filename(info)
                )


        except Exception as download_error:

            print(
                "Media download error:",
                download_error
            )

            return jsonify({

                "status":
                    "error",

                "message":
                    "Media could not be downloaded.",

                "error":
                    str(download_error)

            }), 400


        # =========================
        # FIND DOWNLOADED FILE
        # =========================

        base_name = os.path.splitext(
            downloaded_file
        )[0]

        actual_file = None


        for filename in os.listdir(
            download_folder
        ):

            file_path = os.path.join(
                download_folder,
                filename
            )

            if (
                os.path.isfile(file_path)
                and filename.startswith(
                    os.path.basename(base_name)
                )
            ):

                actual_file = filename

                break


        if not actual_file:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Downloaded file could not be found."

            }), 500


        # =========================
        # DOWNLOAD URL
        # =========================

        download_url = (
            request.host_url.rstrip("/")
            + "/api/local-download/"
            + actual_file
        )


        # =========================
        # SUCCESS
        # =========================

        return jsonify({

            "status":
                "success",

            "message":
                "Media downloaded successfully.",

            "url":
                url,

            "format":
                format_type,

            "quality":
                quality,

            "filename":
                actual_file,

            "download_url":
                download_url

        })


    except Exception as error:

        print(
            "Download Error:",
            error
        )

        return jsonify({

            "status":
                "error",

            "message":
                "Download request failed.",

            "error":
                str(error)

        }), 500


# ==================================================
# LOCAL FILE LIST
# ==================================================

@app.route("/api/local-files")
def local_files():

    try:

        download_folder = os.path.join(
            app.root_path,
            "downloads"
        )

        if not os.path.exists(
            download_folder
        ):

            return jsonify({
                "status": "error",
                "message":
                    "Downloads folder not found."
            }), 404

        files = []

        for filename in os.listdir(
            download_folder
        ):

            file_path = os.path.join(
                download_folder,
                filename
            )

            if os.path.isfile(
                file_path
            ):

                files.append(
                    filename
                )

        return jsonify({

            "status": "success",

            "message":
                "Local media files found.",

            "files":
                files

        })


    except Exception as error:

        print(
            "Local file error:",
            error
        )

        return jsonify({

            "status": "error",

            "message":
                "Could not read local files."

        }), 500


# ==================================================
# LOCAL FILE DOWNLOAD
# ==================================================

@app.route(
    "/api/local-download/<path:filename>"
)
def local_download(filename):

    try:

        download_folder = os.path.join(
            app.root_path,
            "downloads"
        )

        file_path = os.path.join(
            download_folder,
            filename
        )

        if not os.path.isfile(
            file_path
        ):

            return jsonify({

                "status": "error",

                "message":
                    "File not found."

            }), 404


        return send_from_directory(
            download_folder,
            filename,
            as_attachment=True
        )


    except Exception as error:

        print(
            "Local download error:",
            error
        )

        return jsonify({

            "status": "error",

            "message":
                "Could not download file."

        }), 500


# ==================================================
# START SERVER
# ==================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        ),
        debug=True
    )