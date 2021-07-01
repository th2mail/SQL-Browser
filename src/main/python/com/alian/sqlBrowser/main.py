"""
Alian Solution Web Server
"""
from __future__ import print_function
from __future__ import unicode_literals
import os.path
import json
from json import JSONEncoder

import tornado.auth
import tornado.escape
import tornado.ioloop
from tornado.options import define, options
import tornado.web

import pymysql
import re
import datetime

PORT = 6098 # server port
define("port", default=PORT, help="run on the given port", type=int)

#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#
#           SQL-Browser
#
#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

############################################################################################################################################
# 클래스명 : selectSchemaList
# 기능설명 : SQL-Browser 의 트리 목록 정보 조회(DB, Table, Column Name)
############################################################################################################################################
class selectSchemaList(tornado.web.RequestHandler):
    def post(self, *args):
        result = ''

        conn = pymysql.connect(host='192.168.111.101', user='root', password='Daejeon#123', db='SAMPLE', charset='utf8')
        cursor = conn.cursor()
        sql = "SHOW DATABASES"
        cursor.execute(sql.encode('utf8'))
        res = cursor.fetchall()
        conn.close()
        
        for data in res:
            # if data[0] not in ['information_schema','mysql','performance_schema','sys']:
            if data[0] not in ['BROW']:
                # print("step 1 : " + data[0])
                result += \
                    '{' \
                        '"id":"' + data[0] + '_lvl01",' \
                        '"parent":"#",' \
                        '"text":"' + data[0] + '",' \
                        '"state": {"opened": false},' \
                        '"icon": "/src/main/webapp/resources/images/database.svg"' \
                    '},'

                conn2 = pymysql.connect(host='192.168.111.101', user='root', password='Daejeon#123', db=data[0], charset='utf8')
                cursor2 = conn2.cursor()
                sql2 = "SHOW TABLE STATUS"
                cursor2.execute(sql2.encode('utf8'))
                res2 = cursor2.fetchall()
                conn2.close()

                for data2 in res2:
                    # print("step 2 : " + data2[0])
                    result += \
                        '{' \
                            '"id":"' + data2[0] + '_lvl02",' \
                            '"parent":"' + data[0] + '_lvl01",' \
                            '"text":"' + data2[0] + '",' \
                            '"state": {"opened": false},' \
                            '"icon": "/src/main/webapp/resources/images/table.svg"' \
                            '},'
                    
                    conn3 = pymysql.connect(host='192.168.111.101', user='root', password='Daejeon#123', db=data[0], charset='utf8')
                    cursor3 = conn3.cursor()
                    sql3 = "DESCRIBE " + data2[0]
                    cursor3.execute(sql3.encode('utf8'))
                    res3 = cursor3.fetchall()
                    conn3.close()

                    for data3 in res3:
                        # print("step 3 : " + data3[0])
                        result += \
                            '{' \
                                '"id":"' + data3[0] + '_lvl03",' \
                                '"parent":"' + data2[0] + '_lvl02",' \
                                '"text":"' + data3[0] + '",' \
                                '"icon": "/src/main/webapp/resources/images/columns.svg"' \
                            '},'
            
        result = '[' + result[:-1] + ']'

        # conn3.close()
        # conn2.close()
        # conn.close()

        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Content-Type', 'application/json;charset=UTF-8')
        self.write(json.dumps({'result' : result}))
        self.finish()

############################################################################################################################################
# 클래스명 : selectDBList
# 기능설명 : SQL-Browser 의 DB 목록 정보 조회(DB Names)
############################################################################################################################################
class selectDBList(tornado.web.RequestHandler):
    def post(self, *args):
        conn = pymysql.connect(host='192.168.111.101', user='root', password='Daejeon#123', db='SAMPLE', charset='utf8')
        cursor = conn.cursor()
        sql = "SHOW DATABASES"
        cursor.execute(sql.encode('utf8'))
        res = cursor.fetchall()

        result = ''
        for data in res:
            # if data[0] not in ['information_schema','mysql','performance_schema','sys']:
            if data[0] not in ['']:
                result += \
                    '{' \
                        '"value":"' + data[0] + '",' \
                        '"text":"' + data[0] + '"'\
                    '},'

        result = result[:-1]
        result = '[' + result + ']'

        conn.close()

        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Content-Type', 'application/json;charset=UTF-8')
        self.write(json.dumps({'result' : result}))
        self.finish()

############################################################################################################################################
# Execute Query Sentence
############################################################################################################################################
class executeQueryList(tornado.web.RequestHandler):
    def post(self, *args):
        # Extract value as key from json object
        json_body_str = tornado.escape.json_decode(self.request.body)
        body_dict = json.loads(json_body_str)
        db_s  = body_dict['db']             # Database to connect
        sql_s = body_dict['sql']#.upper()    # SQL statement
        print('############################################################################')
        print('db_s : ')
        print(db_s)
        print('sql_s : ')
        print(sql_s)
        print('############################################################################')

        # Database connection and query execution
        conn = pymysql.connect(host='192.168.111.101', user='root', password='Daejeon#123', db=db_s, charset='utf8')
        cur = conn.cursor()

        # SQL문 실행(사용자가 입력한 쿼리문 실행)
        cur.execute(sql_s.encode('utf8').upper())
        res = cur.fetchall()

        # 헤더 Fetch
        ret_head = []
        ret_head.append('recid')
        header_a = [x[0] for x in cur.description]
        for data in header_a:
            ret_head.append(data)

        # 데이타 Fetch
        json_a = []
        cnt = 0
        for temp in res:
            ls = list(temp)
            cnt += 1
            ls.insert(0, cnt)
            data = tuple(ls)            
            json_a.append(dict(zip(ret_head, data)))
        ret_data = json.dumps(json_a)        
        conn.close() # Database connection termination

        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Content-Type', 'application/json;charset=UTF-8')
        self.write(
            json.dumps(
                {
                    'result' : {
                        'head' : ret_head 
                      , 'data' : json_a # ret_data는 한글이 깨짐??? 왜 그럴까?
                    }
                }
            )
        )
        self.finish()           

#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#
#           etc
#
#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class MainHandler(tornado.web.RequestHandler):
    """Simple example Main Handler"""
    def get(self):
        """main page set up"""
        self.render("tornado_index.html", messages=None)

class AjaxHandler(tornado.web.RequestHandler):
    """Simple, ajax handler"""
    def get(self, *args, **kwargs):
        """get unlikely to be used for ajax"""
        self.write("Not allowed")
        self.finish()

    def post(self, *args):
        """Example handle ajax post"""
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Content-Type', 'application/json;charset=UTF-8')

        dic = tornado.escape.json_decode(self.request.body)
        print(dic)

        # useful code goes here
        self.write(json.dumps({'status': 'ok', 'sent': dic}))
        self.finish()

class selectTest(tornado.web.RequestHandler):
    """Simple, ajax handler"""
    def get(self, *args, **kwargs):
        """get unlikely to be used for ajax"""
        self.write("Not allowed")
        self.finish()

    def post(self, *args):
        conn = pymysql.connect(host='192.168.111.101', user='root', password='Daejeon#123', db='SAMPLE', charset='utf8')
        cursor = conn.cursor()

        sql = "SELECT * FROM TB_SAMPLE"

        cursor.execute(sql.encode('utf8'))
        res = cursor.fetchall()

        for data in res:
            print(data[1])
            print(data)

        # conn.commit()
        conn.close()

        """Example handle ajax post"""
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Content-Type', 'application/json;charset=UTF-8')

        dic = tornado.escape.json_decode(self.request.body)
        print(dic)
        # useful code goes here
        # self.write(json.dumps({'status': 'ok', 'sent': dic}))
        self.write(json.dumps({'status': res, 'sent': dic}))
        self.finish()

class selectTableList(tornado.web.RequestHandler):
    def post(self, *args):
        conn = pymysql.connect(host='192.168.111.101', user='root', password='Daejeon#123', db='SAMPLE', charset='utf8')
        cursor = conn.cursor()

        dic = tornado.escape.json_decode(self.request.body)
        sql = "SHOW DATABASES"

        cursor.execute(sql.encode('utf8'))
        res = cursor.fetchall()

        result = ''
        for data in res:
            print(data)

        self.finish()

#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#
#           Entry Point : Main & Application
#
#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////        

############################################################################################################################################
# Application handler
############################################################################################################################################
class Application(tornado.web.Application):
    """Alian Solution Web App"""
    def __init__(self):
        handlers = [
            ############################################################################################################################################
            # SQL-Browser
            ############################################################################################################################################
            (r"/(SqlBrowser)/(selectSchemaList)$",  selectSchemaList),  # SQL-Browser 의 트리 목록 정보 조회(DB, Table, Column Name)
            (r"/(SqlBrowser)/(selectDBList)$",      selectDBList),      # SQL-Browser 의 DB 목록 정보 조회(DB Names)
            (r"/(SqlBrowser)/(executeQueryList)$",  executeQueryList),  # SQL-Browser : Run Query

            ############################################################################################################################################
            # etc
            ############################################################################################################################################
            (r"/",                                  MainHandler),
            (r"/(ajax)$",                           AjaxHandler),
            (r"/(sample)/(selectTest)$",            selectTest)
        ]
        settings = dict(
            debug=True,
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "tornado_static")
        )
        tornado.web.Application.__init__(self, handlers, **settings)

############################################################################################################################################
# Start Tornado Server
############################################################################################################################################
def main():
    """start server"""
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    print("=============================================================================================================================")
    print("================================================= SERVER PORT NUMBER : " + str(PORT) + " =================================================")
    print("=============================================================================================================================")
    tornado.ioloop.IOLoop.instance().start()

############################################################################################################################################
# Entry point
############################################################################################################################################
if __name__ == "__main__":
    main()