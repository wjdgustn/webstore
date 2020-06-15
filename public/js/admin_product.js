function deleteItem(item) {
    location.href = `/removeproduct/${item}`;
}

function CreateNew() {
    a = prompt('새로 생성할 상품의 상품 코드를 입력해 주세요.');
    if(a == '') {
        CreateNew();
    }
    if(a == null) {
        return;
    }
    location.href = `/createproduct/${a}`;
}