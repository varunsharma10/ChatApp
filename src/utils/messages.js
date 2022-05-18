const generateMessage = (username, text, cipher) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()

    }
}

const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}