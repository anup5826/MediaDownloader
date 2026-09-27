def process_video(quality="best"):

    allowed_qualities = [
        "best",
        "1080",
        "720",
        "480",
        "360"
    ]

    if quality not in allowed_qualities:

        return {
            "status": "error",
            "type": "video",
            "message": "Invalid video quality."
        }

    return {
        "status": "success",
        "type": "video",
        "quality": quality,
        "message": "Video quality is valid."
    }