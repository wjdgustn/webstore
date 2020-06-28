window.onload = function() {
    document.getElementById('toggle_cart').onclick = function() {
        var clicked = document.getElementById('toggle_cart');
        var element = document.getElementById('manage_cart');
        if(element.hidden) {
            clicked.innerHTML = '클릭하여 장바구니 관리 접기';
            element.hidden = false;
        }
        else {
            clicked.innerHTML = '클릭하여 장바구니 관리 펼치기';
            element.hidden = true;
        }
    }

    document.getElementById('toggle_history').onclick = function() {
        var clicked = document.getElementById('toggle_history');
        var element = document.getElementById('manage_history');
        if(element.hidden) {
            clicked.innerHTML = '클릭하여 구매 기록 관리 접기';
            element.hidden = false;
        }
        else {
            clicked.innerHTML = '클릭하여 구매 기록 관리 펼치기';
            element.hidden = true;
        }
    }

    if(location.hash != '') {
        switch(location.hash) {
            case '#opencart':
                document.getElementById('toggle_history').innerHTML = '클릭하여 장바구니 관리 접기';
                document.getElementById('manage_cart').hidden = false;
                break;
            case '#openhistory':
                document.getElementById('toggle_history').innerHTML = '클릭하여 구매 기록 관리 접기';
                document.getElementById('manage_history').hidden = false;
                break;
        }
    }
}

function Request(method, url) {
    var xhr = new XMLHttpRequest();
    xhr.open( method , url , false );
    xhr.send( null );
    return xhr.responseText;
}

function RemoveFromCart(code) {
    var result = JSON.parse(Request( "POST" , `${location.protocol}//${location.host}/adminuserapi/${userid}?action=removecart&itemcode=${code}` ));
    if(result.code == 'success') {
        location.hash = `#opencart`;
        location.reload();
    }
    else {
        alert(`장바구니 항목 제거에 실패하였습니다.\n서버 메시지 : ${result.message}`);
    }
}

function RemoveFromHistory(code) {
    var result = JSON.parse(Request( "POST" , `${location.protocol}//${location.host}/adminuserapi/${userid}?action=removehistory&code=${code}` ));
    if(result.code == 'success') {
        location.hash = `#openhistory`;
        location.reload();
    }
    else {
        alert(`구매 기록 항목 제거에 실패하였습니다.\n서버 메시지 : ${result.message}`);
    }
}