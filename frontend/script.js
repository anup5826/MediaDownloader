const urlInput = document.getElementById("urlInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const statusMessage = document.getElementById("statusMessage");

const formatSelect = document.getElementById("formatSelect");
const qualitySelect = document.getElementById("qualitySelect");
const qualityGroup = qualitySelect.closest(".option-group");

const downloadBtn = document.getElementById("downloadBtn");


/* =========================
   BACKEND CONFIGURATION
========================= */

/*
   LIVE RENDER BACKEND
*/

const BACKEND_URL =
    "https://mediadownloader-c7x1.onrender.com";


/* =========================
   INITIAL STATE
========================= */

downloadBtn.disabled = true;


/* =========================
   ANALYZE BUTTON
========================= */

analyzeBtn.addEventListener("click", function () {

    const url = urlInput.value.trim();

    if (url === "") {

        statusMessage.textContent =
            "Please enter a video URL.";

        statusMessage.style.color =
            "#ff6b6b";

        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    statusMessage.textContent =
        "Sending URL to backend...";

    statusMessage.style.color =
        "#facc15";


    fetch(
        `${BACKEND_URL}/api/analyze`,
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                url: url,

                format:
                    formatSelect.value,

                quality:
                    qualitySelect.value

            })

        }
    )

    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Server returned an error."
            );
        }

        return response.json();

    })

    .then(data => {

        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze";


        if (data.status === "success") {

            downloadBtn.disabled = false;


            if (
                data.processing &&
                data.processing.message
            ) {

                if (data.processing.quality) {

                    statusMessage.textContent =
                        data.processing.message +
                        " Quality: " +
                        data.processing.quality;

                } else {

                    statusMessage.textContent =
                        data.processing.message;

                }

            } else {

                statusMessage.textContent =
                    "Request processed successfully.";

            }

            statusMessage.style.color =
                "#4ade80";


            console.log(
                "Backend response:",
                data
            );

        } else {

            downloadBtn.disabled = true;

            statusMessage.textContent =
                data.message ||
                "Request failed.";

            statusMessage.style.color =
                "#ff6b6b";

        }

    })

    .catch(error => {

        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze";

        downloadBtn.disabled = true;

        statusMessage.textContent =
            "Could not connect to backend.";

        statusMessage.style.color =
            "#ff6b6b";


        console.error(
            "Backend error:",
            error
        );

    });

});


/* =========================
   FORMAT CHANGE
========================= */

formatSelect.addEventListener(
    "change",
    function () {

        downloadBtn.disabled = true;

        qualitySelect.innerHTML = "";


        if (
            formatSelect.value === "audio"
        ) {

            qualityGroup.style.display =
                "flex";

            qualitySelect.innerHTML = `

                <option value="best">
                    Best Available
                </option>

                <option value="high">
                    High
                </option>

                <option value="medium">
                    Medium
                </option>

            `;

        } else {

            qualityGroup.style.display =
                "flex";

            qualitySelect.innerHTML = `

                <option value="best">
                    Best Available
                </option>

                <option value="1080">
                    1080p
                </option>

                <option value="720">
                    720p
                </option>

                <option value="480">
                    480p
                </option>

                <option value="360">
                    360p
                </option>

            `;

        }

    }
);


/* =========================
   QUALITY CHANGE
========================= */

qualitySelect.addEventListener(
    "change",
    function () {

        downloadBtn.disabled = true;

    }
);


/* =========================
   DOWNLOAD BUTTON
========================= */

downloadBtn.addEventListener(
    "click",
    function () {

        const url =
            urlInput.value.trim();

        if (url === "") {

            statusMessage.textContent =
                "Please enter a video URL first.";

            statusMessage.style.color =
                "#ff6b6b";

            return;
        }


        downloadBtn.disabled = true;

        downloadBtn.textContent =
            "Processing...";

        statusMessage.textContent =
            "Sending request to backend...";

        statusMessage.style.color =
            "#facc15";


        fetch(
            `${BACKEND_URL}/api/download`,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    url: url,

                    format:
                        formatSelect.value,

                    quality:
                        qualitySelect.value

                })

            }
        )

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Server returned an error."
                );
            }

            return response.json();

        })

        .then(data => {

            if (
                data.status === "success"
            ) {

                statusMessage.textContent =
                    "Request validated. Preparing download...";

                statusMessage.style.color =
                    "#4ade80";


                console.log(
                    "Download request:",
                    data
                );


                setTimeout(
                    function () {

                        downloadBtn.disabled =
                            false;

                        downloadBtn.textContent =
                            "Download";

                        statusMessage.textContent =
                            "Download is ready when a permitted local media file is available.";

                        statusMessage.style.color =
                            "#4ade80";

                    },
                    1000
                );


            } else {

                downloadBtn.disabled =
                    false;

                downloadBtn.textContent =
                    "Download";

                statusMessage.textContent =
                    data.message ||
                    "Download request failed.";

                statusMessage.style.color =
                    "#ff6b6b";

            }

        })

        .catch(error => {

            downloadBtn.disabled =
                false;

            downloadBtn.textContent =
                "Download";

            statusMessage.textContent =
                "Could not connect to backend.";

            statusMessage.style.color =
                "#ff6b6b";


            console.error(
                "Download error:",
                error
            );

        });

    }
);


/* =========================
   BACKEND CONNECTION TEST
========================= */

async function testBackend() {

    try {

        const response =
            await fetch(
                `${BACKEND_URL}/api/test`
            );

        if (!response.ok) {

            throw new Error(
                "Backend test failed."
            );
        }

        const data =
            await response.json();

        console.log(
            "Backend:",
            data.message
        );

    } catch (error) {

        console.error(
            "Backend connection failed:",
            error
        );

    }

}


/* =========================
   LOCAL FILE TEST
========================= */

async function checkLocalFiles() {

    try {

        const response =
            await fetch(
                `${BACKEND_URL}/api/local-files`
            );

        if (!response.ok) {

            throw new Error(
                "Could not read local files."
            );
        }

        const data =
            await response.json();


        console.log(
            "Local files:",
            data
        );


        if (
            data.status === "success"
        ) {

            if (
                data.files.length === 0
            ) {

                console.log(
                    "No local media files found."
                );

                return;
            }


            console.log(
                "Available files:",
                data.files
            );

        } else {

            console.error(
                data.message
            );

        }

    } catch (error) {

        console.error(
            "Local file check failed:",
            error
        );

    }

}


/* =========================
   START TESTS
========================= */

testBackend();

checkLocalFiles();