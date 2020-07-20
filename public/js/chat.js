const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $chatSidebar = document.querySelector('#sidebar');

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = ()=>{
    // new message element
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMarign = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMarign;
    
    // visible height
    const vesibleHeight = $messages.offsetHeight

    // height of mesage container
    const containerHeight = $messages.scrollHeight

    // how far I have scrolled?
    const scrollOffset = $messages.scrollTop + vesibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message)=>{
    console.log(message);
    const html = Mustache.render(messageTemplate, { 
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('locationMessage', (message)=>{
    console.log(message);
    const html = Mustache.render(locationMessageTemplate, { 
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        users,
        room
    });
    $chatSidebar.innerHTML = html;
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault();

    // disable send button
    $messageFormButton.setAttribute('disabled', 'disabled');

    let message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error)=>{

        // enable send button after acknowledgment
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error){
            return console.log(error);
        }
        console.log('Message deliverd!');
    });

})

$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert("Geolocation is not supported for this browser");
    }

    // disable send location button
    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position)=>{
        
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, ()=>{
            console.log('Location shared!');

            // enable send location button
            $sendLocationButton.removeAttribute('disabled');

        })
    })
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error);
        location.href ='/';
    }
});