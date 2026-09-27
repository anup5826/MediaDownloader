def process_audio(quality="best"):

    allowed_qualities = [
        "best",
        "high",
        "medium"
    ]

    if quality not in allowed_qualities:

        return {
            "status": "error",
            "type": "audio",
            "message": "Invalid audio quality."
        }

    return {
        "status": "success",
        "type": "audio",
        "quality": quality,
        "message": "Audio quality is valid."
    }