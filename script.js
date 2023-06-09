var decodeEntities = (function() {
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities;
})();

function getImagesFromRedditGallery(postData) {
    // Fetch the gallery post's JSON data
    // Extract the media_metadata and gallery_data objects
    const mediaMetadata = postData.media_metadata;
    const galleryData = postData.gallery_data;

    // Iterate through the gallery_data items and extract image URLs
    const imageUrls = galleryData.items.map(item => {
        const mediaId = item.media_id;
        const metadata = mediaMetadata[mediaId];

        // Choose the desired image size (e.g. 's', 'm', 'l', 'xl') from the variants available
        const imageUrl = metadata.s.u;
        return imageUrl;
    });
    return imageUrls;
}

function addPost(ci) {
    fetch(posts[ci] + ".json")
        .then(response => {
            if (!response.ok) {
                // make the promise be rejected if we didn't get a 2xx response
                throw new Error("Not 2xx response", {
                    cause: response
                });
            } else {
                return response.json()
            }
        })
        .then(async data => {
            const postData = data[0].data.children[0].data;
            let mediaLink = postData.is_video ? decodeEntities(postData.secure_media.reddit_video.fallback_url) : decodeEntities(postData.url);
            if (mediaLink == "" || mediaLink == null || mediaLink == undefined) {
                throw new Error("No media: " +  posts[ci])
            }
            const title = postData.title
            let s;
            let linkB;
            var encloser = document.createElement("div")
            encloser.id = "f" + ci
            encloser.title = title
            encloser.onclick = () => {
                document.querySelector("#f" + ci + " > .a").style.opacity = document.querySelector("#f" + ci + " > .a").style.opacity == 1 ? 0 : 1
                document.querySelectorAll("#f" + ci + " > .a > *").forEach((it) => {
                    it.style.pointerEvents = it.style.pointerEvents == "all" ? "none" : "all"
                })
            }
            if ((mediaLink.toLowerCase().includes("imgur.com") && mediaLink.toLowerCase().includes(".gifv"))) {
                var vid = document.createElement("video")
                vid.height = 500
                vid.setAttribute('playsinline', 'playsinline')
                vid.loop = true
                vid.autoplay = true
                vid.muted = true
                vid.src = mediaLink.replace("gifv", "mp4")
                linkB = document.createElement("button")
                linkB.onclick = e => {
                    if (vid.paused) {
                        vid.play()
                        linkB.innerHTML = "▶"
                    } else {
                        vid.pause()
                        linkB.innerHTML = "⏸"
                    }
                    e.stopPropagation(); 
                }
                linkB.innerHTML = "▶"
                encloser.insertAdjacentElement("beforeend", vid)
            }
            else if (([".mp4", ".ogg", ".webm"]).some(ftype => mediaLink.slice(mediaLink.lastIndexOf('.')).includes(ftype))) {
                var vid = document.createElement("video")
                vid.setAttribute('playsinline', 'playsinline')
                vid.loop = true
		        vid.autoplay = true
                vid.muted = true
                vid.src = mediaLink
                linkB = document.createElement("button")
                linkB.onclick = e => {
                    if (vid.paused) {
                        vid.play()
                        linkB.innerHTML = "▶"
                    } else {
                        vid.pause()
                        linkB.innerHTML = "⏸"
                    }
                    e.stopPropagation(); 
                }
                linkB.innerHTML = "▶"
                encloser.insertAdjacentElement("beforeend", vid)
            } else if ((mediaLink.toLowerCase().includes("redgifs.com") || mediaLink.toLowerCase().includes("gfycat.com")) && !(([".apng", ".gif", ".ico", ".cur", ".jpg", ".jpeg", ".jfif", ".pjpeg", ".pjp", ".png", ".svg"]).some(ftype => mediaLink.slice(mediaLink.lastIndexOf('.')).includes(ftype)))) {
                try {
                    mediaLink = decodeEntities(postData.preview.reddit_video_preview.fallback_url)
                    fetch(mediaLink)
                    var vid = document.createElement("video")
                    vid.setAttribute('playsinline', 'playsinline')
                    vid.loop = true
                    vid.autoplay = true
                    vid.muted = true
                    vid.src = mediaLink
                    linkB = document.createElement("button")
                    linkB.onclick = () => {
                        if (vid.paused) {
                            vid.play()
                            linkB.innerHTML = "▶"
                        } else {
                            vid.pause()
                            linkB.innerHTML = "⏸"
                        }
                    }
                    linkB.innerHTML = "▶"
                    encloser.insertAdjacentElement("beforeend", vid)
                }
                catch {
                    var iframe = document.createElement('iframe')
                    iframe.scroll = "no";
                    const mL = mediaLink.replace("/watch", "")
                    iframe.src = mL.substring(0, mL.lastIndexOf("/")) + "/ifr" + mL.substring(mL.lastIndexOf("/"));
                    encloser.insertAdjacentElement("beforeend", iframe)
                }
            } else if (([".apng", ".gif", ".ico", ".cur", ".jpg", ".jpeg", ".jfif", ".pjpeg", ".pjp", ".png", ".svg"]).some(ftype => mediaLink.slice(mediaLink.lastIndexOf('.')).includes(ftype))) {
		    if (mediaLink.toLowerCase().includes("redgifs.com") || mediaLink.toLowerCase().includes("gfycat.com")) {
			mediaLink = decodeEntities(postData.preview.images[0].source.url)
		    }
                try {
                 await fetch(mediaLink)
                .then(r=>{
                  if(r.redirected && r.url.toLowerCase().includes("removed")){
                     mediaLink = decodeEntities(postData.preview.images[0].source.url)
                  } 
                })
               } catch {
                 
               } finally {
                 var img = document.createElement('img')
                img.src = mediaLink;
                img.onload = () => {
                    if (img.naturalWidth == 0) {
                        encloser.style.display = "none"
                        throw new Error("Error occured with image: " + mediaLink)
                    } 
                }
                img.onerror = () => {
                    encloser.style.display = "none"
                    throw new Error("Error occured with image: " + mediaLink)
                }
                encloser.insertAdjacentElement("beforeend", img)
               }
                
            } else if (mediaLink.toLowerCase().includes("imgur.com") && !mediaLink.toLowerCase().includes("i.")) {
                var img = document.createElement('img')
                img.src = mediaLink.substring(0, mediaLink.indexOf("imgur.com")) + "i." + mediaLink.substring(mediaLink.indexOf("imgur.com")) + ".jpg";
                img.onload = () => {
                    if (img.naturalWidth == 0) {
                        encloser.style.display = "none"
                        throw new Error("Error occured with image: " + mediaLink)
                    } 
                }
                img.onerror = () => {
                    encloser.style.display = "none"
                    throw new Error("Error occured with image: " + mediaLink)
                }
                encloser.insertAdjacentElement("beforeend", img)
            } else if (mediaLink.toLowerCase().includes("gallery")) {
                var images = (getImagesFromRedditGallery(postData).map(item => {
                    return decodeEntities(item)
                }));
                var show = document.createElement("div")
                show.id = "c" + ci + "-show"
                show.class = "show"
                var container = document.createElement("div")
                container.classList.add("container")
                container.id = "c" + ci
                container.dataset.index = 1
                images.forEach(item => {
                  var img = document.createElement("img")
                  img.classList.add("mySlides")
                  img.src = item
                  img.style.width = "100%"
                  container.insertAdjacentElement("beforeend", img)
                })
                var l = document.createElement("a")
                var r = document.createElement("a")
                l.classList.add("prev")
                r.classList.add("next")
                l.onclick = (e) => { plusSlides(-1); e.stopPropagation(); }
                r.onclick = (e) => { plusSlides(1); e.stopPropagation(); }
                l.innerHTML = "&#10094;"
                r.innerHTML = "&#10095;"
                container.insertAdjacentElement("beforeend", l)
                container.insertAdjacentElement("beforeend", r)
                show.insertAdjacentElement("afterbegin", container)
                s = document.createElement('script');
                let js = `
		let slideShow` + ci + ` = document.querySelector("#c" + ` + ci + `)
		showSlides(slideShow` + ci + `.dataset.index)

		function plusSlides(n) {
			let slideShow` + ci + ` = document.querySelector("#c" + ` + ci + `)
			showSlides(slideShow` + ci + `.dataset.index -= -1 * n);
		}

		function currentSlide(n) {
			let slideShow` + ci + ` = document.querySelector("#c" + ` + ci + `)
			showSlides(slideShow` + ci + `.dataset.index = n);
		}

		function showSlides(n) {
			let i;
			let slides = document.querySelectorAll("#c" + ` + ci + ` + "> .mySlides");
			let slideShow` + ci + ` = document.querySelector("#c" + ` + ci + `)
			if (n > slides.length) {
				slideShow` + ci + `.dataset.index = "1"
			}
			if (n < 1) {
				slideShow` + ci + `.dataset.index = "" + slides.length
			}
			for (i = 0; i < slides.length; i++) {
				slides[i].style.display = "none";
			}
			slides[slideShow` + ci + `.dataset.index - 1].style.display = "block";
		}

`
                s.setAttribute('src', "data:application/x-javascript;base64," + btoa(js));
               
              encloser.insertAdjacentElement("beforeend", show);
            } else {
                var iframe = document.createElement('iframe')
                iframe.scroll = "no";
                iframe.src = mediaLink;
                encloser.insertAdjacentElement("beforeend", iframe);
            }
          document.querySelector('#posts').insertAdjacentElement("beforeend", encloser);
          if (s != null) {
            encloser.insertAdjacentElement("beforeend", s)
          }
          var link = document.createElement('div')
          link.classList.add("a")
          var linkI = document.createElement('a')
          linkI.href = "https://www.reddit.com" + postData.permalink
          var linkName = document.createElement('b')
          linkName.innerHTML = title
          linkI.insertAdjacentElement("afterbegin", linkName)
          linkI.insertAdjacentElement("beforeend", document.createElement('br'))
          var linkSub = document.createElement('span')
          linkSub.innerHTML = postData.subreddit_name_prefixed
          linkI.insertAdjacentElement("beforeend", linkSub)
          if (linkB != null) {
            link.insertAdjacentElement("beforeend", linkB)
          }
          link.insertAdjacentElement("afterbegin", linkI)
          encloser.insertAdjacentElement("beforeend", link)
        })
}

async function shufflePosts() {
    let currentIndex = posts.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [posts[currentIndex], posts[randomIndex]] = [
            posts[randomIndex], posts[currentIndex]
        ];
    }
    document.querySelector('#posts').innerHTML = "";
    currArr = []
    for (currInd = 0; currInd < 4 * Math.round(window.innerWidth / 500); currInd++) {
        currArr.push(currInd)
        const ci = currInd;
        await addPost(ci);
    }

}
var posts;

var currInd = 0;
var currArr = []
var url = Array.from((new URLSearchParams(window.location.href)).values())[0] != "" ? Array.from((new URLSearchParams(window.location.href)).values())[0] : prompt("Enter the URL to your Eternity saved posts")
try {
	new URL(url)
	getPosts(url)
	
} catch (e) {
	url = "https://" + url
	try {
		new URL(url)
		getPosts(url)
	} catch {
		posts = ["https://www.reddit.com/r/loadingicon/random/"]
		addPost(0)
		document.querySelector("body > button").innerHTML = "Sorry, no posts found. Reload to set a new URL"
		document.querySelector("body > button").disabled = true
	}
}
function getPosts(url) {
	fetch(url)
	    .then(response => response.json())
	    .then(json => {
		try {
			posts = Object.values(json).sort(function(x, y){
			    return y.created_epoch - x.created_epoch;
			}).map(item => item.url)
			for (currInd = 0; currInd < 4 * Math.floor(window.innerWidth / 500); currInd++) {
			    currArr.push(currInd)
			    const ci = currInd;
			    addPost(ci);
			}
		} catch {
			posts = ["https://www.reddit.com/r/loadingicon/random/"]
			addPost(0)
			document.querySelector("body > button").innerHTML = "Sorry, no posts found. Reload to set a new URL"
			document.querySelector("body > button").disabled = true
		}
	    })
}
window.onscroll = () => {
    currInd = (Math.round(window.scrollY * Math.floor(window.innerWidth / 500) / (window.innerHeight * 0.75))) + 3 * Math.floor(window.innerWidth / 500)
      const ci = currInd
      if (!currArr.includes(ci) && ci < posts.length) {
	  currArr.push(ci)
	  addPost(currInd);
      }
}
