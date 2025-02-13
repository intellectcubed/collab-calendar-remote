function openPopup() {
    document.getElementById('popupForm').style.display = 'block';
}

function closePopup() {
    document.getElementById('popupForm').style.display = 'none';
}

function applyEditing() {
    // Add your apply logic here
    console.log('Apply button clicked');
    closePopup();
}

function cancelEditing() {
    // Add your cancel logic here
    console.log('Cancel button clicked');
    closePopup();
}

// Close the popup when clicking outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById('popupForm')) {
        closePopup();
    }
}
