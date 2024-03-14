
    let rotateLeftKey = localStorage.getItem('rotateLeft')
    if(rotateLeftKey === null){
        localStorage.setItem('rotateLeft', 'ArrowLeft')
        rotateLeftKey = 'ArrowLeft'
    }
    let rotateRightKey = localStorage.getItem('rotateRight')
    if(rotateRightKey === null){
        localStorage.setItem('rotateRight','ArrowRight')
        rotateRightKey = 'ArrowRight'
    }
    let thrustKey = localStorage.getItem('thrustKey')
    if(thrustKey===null){
        localStorage.setItem('thrustKey', 'ArrowUp')
        thrustKey = 'ArrowUp'
    }
    console.log(MyGame)
    document.getElementById('thrustKeyInput').value = thrustKey
    document.getElementById('rotateRightKeyInput').value = rotateRightKey
    document.getElementById('rotateLeftKeyInput').value = rotateLeftKey

    function updateThrustKey() {
        let newThrustKey = document.getElementById("thrustKeyInput").value
        thrustKey = newThrustKey
        localStorage.setItem('thrustKey', thrustKey)
    }

    function updateRotationLeftKey() {
        let newRotationLeftKey = document.getElementById("rotateLeftKeyInput").value
        rotateLeftKey = newRotationLeftKey
        localStorage.setItem('rotateLeft', rotateLeftKey)
    }

    function updateRotationRightKey() {
        let newRotationRightKey = document.getElementById("rotateRightKeyInput").value
        rotateRightKey = newRotationRightKey
        localStorage.setItem('rotateRight', rotateRightKey)
    }

    function resetControls(){
        document.getElementById("thrustKeyInput").value = 'ArrowUp'
        document.getElementById("rotateLeftKeyInput").value = 'ArrowLeft'
        document.getElementById("rotateRightKeyInput").value = 'ArrowRight'
        thrustKey = 'ArrowUp'
        rotateRightKey = 'ArrowRight'
        rotateLeftKey = 'ArrowLeft'
        localStorage.setItem('thrustKey', thrustKey)
        localStorage.setItem('rotateLeft', rotateLeftKey)
        localStorage.setItem('rotateRight', rotateRightKey)
    }
