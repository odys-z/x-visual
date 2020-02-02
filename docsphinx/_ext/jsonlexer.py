def setup(app):
    # enable Pygments json lexer
    try:
        import pygments
        if pygments.__version__ >= '1.5':
            # use JSON lexer included in recent versions of Pygments
            from pygments.lexers import JsonLexer
        else:
            # use JSON lexer from pygments-json if installed
            from pygson.json_lexer import JSONLexer as JsonLexer
    except ImportError:
        # print('Import jsonlexer failed.')
        pass  # not fatal if we have old (or no) Pygments and no pygments-json
    else:
        # print('Import jsonlexer ok.')
        app.add_lexer('json', JsonLexer())
