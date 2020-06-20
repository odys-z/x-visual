# [join multiple line between a pattern](https://superuser.com/questions/420497/join-lines-between-a-certain-text-pattern-in-vim)

```
	A.
	text
	text
	text


	A.
	more text

	more text

	A.
	more text
```

vim command

```
:%s/\n\(\(A\.$\)\@!.*\)/\1/
```

matches "everything matched except the starting newline (i.e. the group above)"

```
	A.texttexttext
	A.more textmore text
	A.more text
```

Where "\@!" means requires no match, see [vim man page](http://vimdoc.sourceforge.net/htmldoc/pattern.html#/\@!)

```
    Example				matches
    foo\(bar\)\@!		any "foo" not followed by "bar"
    a.\{-}p\@!			"a", "ap", "app", etc. not followed by a "p"
    if \(\(then\)\@!.\)*$	"if " not followed by "then"
```

To collect a 1D coordinates:

```
    %s/\n\s*\(\d*\.\d*,\?\|\],\?\|\[\)$/\1/g
```
