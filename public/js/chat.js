const socket = io()

//Element
const messageFormDOM = document.querySelector('#message-form')
const messageFormInputDOM = messageFormDOM.querySelector('input')
const messageFormButtonDOM = messageFormDOM.querySelector('button')
const locationDOM = document.querySelector('#sendLocation') //location button
const messagesDOM = document.querySelector('#messages')



//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {
    username,
    room
} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

function Encrypt(plaintext) {
    if (plaintext.length < 4) {
        alert("please enter some plaintext");
        return;
    }
    var key = (plaintext.length > 1) ? Math.floor(plaintext.length / 2) : 1;
    if (key > Math.floor(2 * (plaintext.length - 1))) {
        alert("key is too large for the plaintext length.");
        return;
    }
    let ciphertext = "";
    let line;
    for (line = 0; line < key - 1; line++) {
        let skip = 2 * (key - line - 1);
        let j = 0;
        for (let i = line; i < plaintext.length;) {
            ciphertext += plaintext.charAt(i);
            if ((line == 0) || (j % 2 == 0)) {
                i += skip
            } else {
                i += 2 * (key - 1) - skip
            };
            j++;
        }
    }
    for (let i = line; i < plaintext.length; i += 2 * (key - 1)) {
        ciphertext += plaintext.charAt(i);
    }
    console.log(ciphertext);
    return ciphertext;
}

function Decrypt(ciphertext) {
    if (ciphertext.length < 1) {
        alert("please enter some ciphertext (letters only)");
        return;
    }
    var key = (ciphertext.length > 1) ? Math.floor(ciphertext.length / 2) : 1;
    if (key > Math.floor(2 * (ciphertext.length - 1))) {
        alert("please enter 1 - 22.");
        return;
    }
    let pt = new Array(ciphertext.length);
    let k = 0;
    let line;
    for (line = 0; line < key - 1; line++) {
        let skip = 2 * (key - line - 1);
        let j = 0;
        for (i = line; i < ciphertext.length;) {
            pt[i] = ciphertext.charAt(k++);
            if ((line == 0) || (j % 2 == 0)) i += skip;
            else i += 2 * (key - 1) - skip;
            j++;
        }
    }
    for (i = line; i < ciphertext.length; i += 2 * (key - 1)) pt[i] = ciphertext.charAt(k++);
    return pt;
}

const autoscroll = () => {
    //Get new message element
    const newMessage = messagesDOM.lastElementChild

    //Get height of new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = messagesDOM.offsetHeight

    //Height of messages container
    const containerHeight = messagesDOM.scrollHeight

    //How far down have we scrolled

    const scrollOffset = messagesDOM.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messagesDOM.scrollTop = messagesDOM.scrollHeight //scroll to bottom
    }
}


socket.on('Message', (Message) => {
    //console.log(url)
    let cipher = Decrypt(Message.text)
    let res = "";
    cipher.forEach(e => {
        res += e
    })
    const HTML = Mustache.render(messageTemplate, {
        username: Message.username,
        message: (Message.text == `Welcome to the chatting app` || Message.username == "Admin") ? Message.text : res + `(${Message.text})`,
        createdAt: moment(Message.createdAt).format('h:mm A')
    })

    messagesDOM.insertAdjacentHTML('beforeend', HTML)
    autoscroll()

})


socket.on('locationMessage', (url) => {
    console.log(url)
    const HTML = Mustache.render(locationMessageTemplate, {
        username: url.username,
        location: url.url,
        createdAt: moment(url.createdAt).format('h:mm A')
    })

    messagesDOM.insertAdjacentHTML('beforeend', HTML)
    autoscroll()

})

socket.on('roomData', ({
    room,
    users
}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html

})

messageFormDOM.addEventListener('submit', (e) => {
    e.preventDefault()

    //Disable form until acknowledged

    messageFormButtonDOM.setAttribute('disabled', 'disabled')

    let message = e.target.elements.message.value //e.target targets form .elements has all the names
    let cipher = Encrypt(message);
    // message += `(${cipher})`;
    //Enable
    socket.emit('sendMessage', (message, cipher), () => {
        messageFormButtonDOM.removeAttribute('disabled')
        messageFormInputDOM.value = ""
        messageFormInputDOM.focus()

        console.log('The message was delivered')

    })
})

locationDOM.addEventListener('click', () => {
    //disable untill acknowledgement

    if (!navigator.geolocation) {
        return alert('Geolocation is not suported by your browser')
    }

    locationDOM.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        pos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

        socket.emit('sendLocation', pos, () => {
            console.log('Location Shared')
            //Enable
            locationDOM.removeAttribute('disabled')


        })

    })

})

socket.emit('join', {
    username,
    room
}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})