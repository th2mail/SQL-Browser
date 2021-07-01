import SETTING from '../common/Setting.js'

/**
    파일명 : Common.js
    설  명 : 공통 Common js 파일

    수정자      수정일      수정내용 
    ------      --------    ----------------------------------------------------------
    kth      21.01.15    최초작성
*/
class Common {    

   constructor() {

   }

   //---------------------------------------------------------
   // 함 수 명 : ajaxCall
   // 기    능 : Ajax 호출
   // 파라미터 : 
   //    req_o : 요청 오브젝트, 
   //       req_o = { 
   //          url      : 호출 클래스명
   //          cmd      : 호출 함수명
   //          opt      : 전달 파라미터
   //          ctrl_nm  : 컨트롤명
   //          ctrl_opt : 컨트롤 종류 - 트리(TR), 셀렉트박스(SB), 콤보박스(CB)
   //       }
   //    callback_f : 콜백함수
   //---------------------------------------------------------
   ajaxCall(req_o, callback_f, this_o) {
      let _this = this;
      
      $.ajax({
         url      : `http://${SETTING.SERVER.HOST}:${SETTING.SERVER.PORT}/${req_o.url}/${req_o.cmd}`,
         type     : 'POST',
         dataType : 'json',
         data     : JSON.stringify(req_o.opt),
         success: function(res_o) {
            // 컨트롤 (default) 초기화
            if (req_o.ctrl_nm && req_o.ctrl_opt)
               _this.initContrl(req_o, res_o);

            // 콜백함수 실행
            if (callback_f)
               callback_f(req_o, res_o, this_o);
         },
         error: function(error_o) {
            // 공통 에러 메세지 팝업창 출력
            alert(error_o);
         }
      });
   }  

   //---------------------------------------------------------
   // 함 수 명 : initControl
   // 기    능 : 컨트롤 (default) 초기화
   // 파라미터 : 
   //    req_o : 요청 오브젝트, 
   //       req_o = { 
   //          url      : 호출 클래스명
   //          cmd      : 호출 함수명
   //          opt      : 전달 파라미터
   //          ctrl_nm  : 컨트롤명
   //          ctrl_opt : 컨트롤 종류 - 트리(TR), 셀렉트박스(SB), 콤보박스(CB)
   //    }
   //    res_o : 응답 오블젝트
   //---------------------------------------------------------
   initContrl(req_o, res_o) {
      switch (req_o.ctrl_opt) {
         // 트리 =======================================================================================
         case `${SETTING.CONTROL_OPTION.TREE}`:       
            $(`#${req_o.ctrl_nm}`).jstree({ 
               'core': { 
                  'data': JSON.parse(res_o.result) 
               } 
            }); 
         break;
         // 셀렉트박스 =================================================================================
         case `${SETTING.CONTROL_OPTION.SELECTBOX}`:  
            JSON.parse(res_o.result).forEach(item => { // item 변수는 배열 각각의 요소들을 순환한다.
               $(`#${req_o.ctrl_nm}`).append(`<option value="${item.value}">${item.text}</option>`);
            });
         break;
         // 콤보박스 ===================================================================================
         case `${SETTING.CONTROL_OPTION.COMBOBOX}`:   
         break;
         // 디폴트 =====================================================================================
         default:
         break;
      }
   }   

   isIE() {
      return (navigator.appName === 'Netscape' && navigator.userAgent.search('Trident') !== -1) ||
         navigator.userAgent.toLowerCase().indexOf("msie") !== -1;
   }

   doFadeInOut($item) {
      $item.fadeOut();
      $item.fadeIn();
   }

}

export default Common
