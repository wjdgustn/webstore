window.onload = function() {
    document.getElementById('remove_group').onclick = function() {
        location.href = `/removepermissiongroup/${groupname}`;
    }
}