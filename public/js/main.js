window.onload = function() {
    document.getElementById('profile_image').onclick = function() {
        var profile_info = document.getElementById('profile_info');
        if (profile_info.hidden) {
            profile_info.hidden = false;
        } else {
            profile_info.hidden = true;
        }
    }
    document.getElementById('buy').onclick = function() {
        var result = JSON.parse(Request( "POST" , `${location.protocol}//${location.host}/userapi?action=buy` ));
        if(result.code == 'success') {
            alert('결제가 완료되었습니다.');
            location.reload();
        }
        else {
            alert(`결제에 실패하였습니다.\n서버 메시지 : ${result.message}`);
        }
    }
}

function Request(method, url) {
    var xhr = new XMLHttpRequest();
    xhr.open( method , url , false );
    xhr.send( null );
    return xhr.responseText;
}

function AddToCart(code) {
    var result = JSON.parse(Request( "POST" , `${location.protocol}//${location.host}/userapi?action=addcart&itemcode=${code}` ));
    if(result.code == 'success') {
        if (confirm('장바구니에 추가되었습니다. 장바구니로 이동하시겠습니까?')) {
            location.href = '/cart'
        }
    }
    else {
        alert(`장바구니 추가에 실패하였습니다.\n서버 메시지 : ${result.message}`);
    }
}

function RemoveFromCart(code) {
    var result = JSON.parse(Request( "POST" , `${location.protocol}//${location.host}/userapi?action=removecart&itemcode=${code}` ));
    if(result.code == 'success') {
        location.reload();
    }
    else {
        alert(`장바구니 항목 제거에 실패하였습니다.\n서버 메시지 : ${result.message}`);
    }
}