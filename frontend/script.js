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

const BACKEND_URL =
    "https://mediadownloader-c7x1.onrender.com";


/* =========================
   INITIAL STATE
========================= */

downloadBtn.disabled = true;


/* =========================
   HELPER FUNCTIONS
========================= */

function showStatus(message, color) {

    statusMessage.textContent = message;
    statusMessage.style.color = color;

}


/* =========================
   ANALYZE BUTTON
========================= */

analyzeBtn.addEventListener("click", function () {

    const url = urlInput.value.trim();

    if (url === "") {

        showStatus(
            "Please enter a video URL.",
            "#ff6b6b"
        );

        return;
    }


    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    showStatus(
        "Sending URL to backend...",
        "#facc15"
    );


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

    .then(async response => {

        let data = {};

        try {

            data = await response.json();

        } catch (error) {

            data = {};

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Server returned ${response.status} error.`
            );

        }


        return data;

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

                    showStatus(
                        data.processing.message +
                        " Quality: " +
                        data.processing.quality,
                        "#4ade80"
                    );

                } else {

                    showStatus(
                        data.processing.message,
                        "#4ade80"
                    );

                }

            } else {

                showStatus(
                    "Request processed successfully.",
                    "#4ade80"
                );

            }


            console.log(
                "Backend response:",
                data
            );

        } else {

            downloadBtn.disabled = true;

            showStatus(
                data.message ||
                "Request failed.",
                "#ff6b6b"
            );

        }

    })

    .catch(error => {

        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze";

        downloadBtn.disabled = true;


        showStatus(
            error.message ||
            "Could not connect to backend.",
            "#ff6b6b"
        );


        console.error(
            "Analyze error:",
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
    async function () {

        const url =
            urlInput.value.trim();


        if (url === "") {

            showStatus(
                "Please enter a video URL first.",
                "#ff6b6b"
            );

            return;
        }


        downloadBtn.disabled = true;

        downloadBtn.textContent =
            "Processing...";


        showStatus(
            "Preparing your download...",
            "#facc15"
        );


        try {

            const response =
                await fetch(
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
                );


            /*
             * Try to read JSON response.
             */

            let data = {};

            try {

                data =
                    await response.json();

            } catch (jsonError) {

                data = {};

            }


            console.log(
                "Download backend response:",
                data
            );


            /*
             * IMPORTANT:
             * Show actual backend error.
             */

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    `Download request failed (${response.status}).`
                );

            }


            /*
             * Backend returned an error
             * even though HTTP status was OK.
             */

            if (
                data.status !== "success"
            ) {

                throw new Error(
                    data.message ||
                    "Download request failed."
                );

            }


            /*
             * SUCCESS
             */

            showStatus(
                data.message ||
                "Download is being prepared...",
                "#4ade80"
            );


            /*
             * Check possible download URL fields.
             */

            const downloadUrl =
                data.download_url ||
                data.file_url ||
                data.downloadUrl ||
                data.fileUrl;


            /*
             * If backend provides a file URL,
             * start browser download.
             */

            if (downloadUrl) {

                showStatus(
                    "Download ready. Starting download...",
                    "#4ade80"
                );


                const link =
                    document.createElement("a");

                link.href =
                    downloadUrl;

                link.download = "";

                link.target =
                    "_blank";

                document.body.appendChild(link);

                link.click();

                link.remove();


                downloadBtn.disabled =
                    false;

                downloadBtn.textContent =
                    "Download";


                return;
            }


            /*
             * Some backends may return a file
             * name instead of a full URL.
             */

            if (data.filename) {

                const fileUrl =
                    `${BACKEND_URL}/api/local-download/` +
                    encodeURIComponent(
                        data.filename
                    );


                showStatus(
                    "Download ready. Starting download...",
                    "#4ade80"
                );


                const link =
                    document.createElement("a");

                link.href =
                    fileUrl;

                link.download = "";

                document.body.appendChild(link);

                link.click();

                link.remove();


                downloadBtn.disabled =
                    false;

                downloadBtn.textContent =
                    "Download";


                return;
            }


            /*
             * Backend successfully processed
             * the request but did not return
             * an actual downloadable file.
             */

            showStatus(
                "Request processed successfully, but the backend did not return a download file.",
                "#facc15"
            );


            console.warn(
                "No download URL returned by backend:",
                data
            );


            downloadBtn.disabled =
                false;

            downloadBtn.textContent =
                "Download";


        } catch (error) {

            downloadBtn.disabled =
                false;

            downloadBtn.textContent =
                "Download";


            /*
             * Show actual backend error
             * instead of falsely saying
             * backend connection failed.
             */

            showStatus(
                error.message ||
                "Download request failed.",
                "#ff6b6b"
            );


            console.error(
                "Download error:",
                error
            );

        }

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


        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            data = {};

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Backend test failed."
            );

        }


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
   START TESTS
========================= */

testBackend();