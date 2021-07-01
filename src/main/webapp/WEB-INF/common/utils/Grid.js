/**
    파일명 : Grid.js
    설  명 : Grid 공통
    추가해야 할 Grid 목록
        1) w2ui, http://w2ui.com/web/
        2) jui, http://jui.io/
        3) toast, https://ui.toast.com/

    수정자      수정일      수정내용 
    ------      --------    ----------------------------------------------------------
    kth      21.01.15    최초작성
*/
class Grid {    

    constructor() {
        
    }

    //---------------------------------------------------------
    // 함 수 명 : init
    // 기    능 : 그리드 초기화
    // 파라미터 : 
    //      req_o = {
    //          name        : 그리드 이름
    //          style       : CSS 스타일
    //          lineNumbers : 줄 번호 유무(true, false)
    //      }
    //---------------------------------------------------------
    init(req_o) {
        // 그리드 초기화
        this.check(`${req_o.name}`);
  
        // 그리드 생성
        $(`#${req_o.name}`).w2grid({
              name : `${req_o.name}`,
              style : `${req_o.style}`,
              show : {
                 lineNumbers : `${req_o.lineNumbers}`
              }
        });        
  
        // 그리드 리프레쉬
        w2ui[`${req_o.name}`].refresh();
     } 
 
    //---------------------------------------------------------
    // 함 수 명 : check
    // 기    능 : 그리드 존재 유무 체크하여, 존재 시 -> destroy!!!
    // 파라미터 : 
    //    name : 그리드 이름
    //---------------------------------------------------------
    check(name) {
        if (w2ui[`${name}`]) {
            w2ui[`${name}`].destroy();
        }
    }
     
}
 
export default Grid