function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

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
    fetch(posts[currInd] + ".json")
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
            let mediaLink = postData.url || postData.secure_media.reddit_video.fallback_url;
            const title = postData.title
            let s;
            var encloser = document.createElement("div")
            encloser.id = "f" + ci
            encloser.title = title
            //encloser.onclick = () => { if (window.confirm(title + "\n\nClick \"Ok\" to visit Reddit")) { window.open(posts[ci], '_blank') }} ;
            if (([".apng", ".gif", ".ico", ".cur", ".jpg", ".jpeg", ".jfif", ".pjpeg", ".pjp", ".png", ".svg"]).includes(mediaLink.slice(mediaLink.lastIndexOf('.')))) {
                try {
                 await fetch(mediaLink)
                .then(r=>{
                  if(r.redirected && r.url.toLowerCase().includes("removed")){
                     mediaLink = postData.preview.images[0].source.url.replaceAll("&amp;", "&")
                  } 
                })
               } catch {
                 
               } finally {
                 var img = document.createElement('img')
                img.src = mediaLink;
                encloser.insertAdjacentElement("beforeend", img)
               }
                
            } else if (([".mp4", ".ogg", ".webm"]).includes(mediaLink.slice(mediaLink.lastIndexOf('.')))) {
                var vid = document.createElement("video")
                vid.setAttribute('playsinline', 'playsinline')
                vid.loop = true
		vid.playsinline = true
                vid.innerHTML = `<source src="` + mediaLink + `">`
                encloser.insertAdjacentElement("beforeend", vid)
            } else if (mediaLink.toLowerCase().includes("redgifs.com") || mediaLink.toLowerCase().includes("gfycat.com")) {
                var iframe = document.createElement('iframe')
                iframe.scroll = "no";
                const mL = mediaLink.replace("/watch", "")
                iframe.src = mL.substring(0, mL.lastIndexOf("/")) + "/ifr" + mL.substring(mL.lastIndexOf("/"));
                encloser.insertAdjacentElement("beforeend", iframe)
            } else if (mediaLink.toLowerCase().includes("imgur.com") && mediaLink.toLowerCase().includes(".gifv")) {
                var vid = document.createElement("video")
                vid.height = 500
                vid.setAttribute('playsinline', 'playsinline')
                vid.loop = true;
		vid.playsinline = true
                vid.innerHTML = `<source src="` + mediaLink.replace("gifv", "mp4") + `">`
                encloser.insertAdjacentElement("beforeend", vid)
            } else if (mediaLink.toLowerCase().includes("imgur.com") && !mediaLink.toLowerCase().includes("i.")) {
                var img = document.createElement('img')
                img.src = mediaLink.substring(0, mediaLink.indexOf("imgur.com")) + "i." + mediaLink.substring(mediaLink.indexOf("imgur.com")) + ".jpg";
                encloser.insertAdjacentElement("beforeend", img)
            } else if (mediaLink.toLowerCase().includes("gallery")) {
                var images = (getImagesFromRedditGallery(postData).map(item => {
                    return item.replaceAll("&amp;", "&")
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
        /*var elem = `<iframe loading="lazy" id="f` + currInd + `" src="https://embed.reddit.com/` + posts[currInd].split("https://www.reddit.com/")[1] + `/?embed=true&amp;ref_source=embed&amp;ref=share&amp;utm_medium=widgets&amp;utm_source=embedv2&amp;theme=dark" scrolling="no" allowfullscreen="true" sandbox="allow-scripts allow-same-origin allow-popups" style="border: medium none; max-width: 100%; border-radius: 8px; display: block; margin: 0px auto;" width="640px" height="500"></iframe>`
           document.querySelector('#posts').insertAdjacentHTML("beforeend", elem)*/
        await addPost(ci);

        // Add the iframe to your webpage


    }

}
var posts;

var currInd = 0;
var currArr = []

fetch(prompt("Enter private URL"))
    .then(response => response.json())
    .then(json => {
        posts = Object.values(json).map(item => item.url)
        for (currInd = 0; currInd < 4 * Math.floor(window.innerWidth / 500); currInd++) {
            currArr.push(currInd)
            const ci = currInd;
            addPost(ci);
        }
    })
window.onscroll = () => {
    currInd = (Math.round(window.scrollY * Math.floor(window.innerWidth / 500) / 750)) + 2 * Math.floor(window.innerWidth / 500)
      const ci = currInd
       console.log(ci)
      if (!currArr.includes(ci) && ci < posts.length) {
          currArr.push(ci)
          addPost(currInd);
      }
}
