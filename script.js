async function upload() {
  const file = document.getElementById("video").files[0];
  if (!file) {
    alert("Video select karo");
    return;
  }

  const fd = new FormData();
  fd.append("video", file);

  document.getElementById("status").innerText = "Uploading...";

  const res = await fetch("/upload", {
    method: "POST",
    body: fd
  });

  const data = await res.json();

  if (data.mp4) {
    document.getElementById("status").innerText = data.mp4;
    console.log("MP4 LINK:", data.mp4);
  } else {
    document.getElementById("status").innerText = "Upload failed";
  }
}
