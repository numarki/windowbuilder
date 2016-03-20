/**
 * Created 24.07.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @author	Evgeniy Malyarov
 *
 * @module  element
 */


/**
 * Базовый класс элементов построителя. его свойства и методы присущи всем элементам построителя,
 * но не характерны для классов Path и Group фреймворка paper.js
 * @class BuilderElement
 * @param attr {Object} - объект со свойствами создаваемого элемента
 *  @param attr.b {paper.Point} - координата узла начала элемента - не путать с координатами вершин пути элемента
 *  @param attr.e {paper.Point} - координата узла конца элемента - не путать с координатами вершин пути элемента
 *  @param attr.contour {Contour} - контур, которому принадлежит элемент
 *  @param attr.type_el {_enm.elm_types}  может измениться при конструировании. например, импост -> рама
 *  @param [attr.inset] {_cat.inserts} -  вставка элемента. если не указано, будет вычислена по типу элемента
 *  @param [attr.path] (r && arc_ccw && more_180)
 * @constructor
 * @extends paper.Group
 * @uses BuilderElementProperties
 * @uses NomenclatureProperties
 */
function BuilderElement(attr){

	BuilderElement.superclass.constructor.call(this);

	if(!attr.row)
		attr.row = this.project.ox.coordinates.add();

	this.__define({
		_row: {
			get: function () {
				return attr.row;
			},
			enumerable: false
		}
	});

	if(attr.proto){

		this.inset = attr.proto.inset;

		if(attr.parent)
			this.parent = attr.parent;
		else if(attr.proto.parent)
			this.parent = attr.proto.parent;

		if(attr.proto instanceof Profile)
			this.insertBelow(attr.proto);

		this.clr = attr.proto.clr;

	}else if(attr.parent)
		this.parent = attr.parent;

	if(!attr.row.cnstr)
		attr.row.cnstr = this.parent.cnstr;

	if(!attr.row.elm)
		attr.row.elm = this.project.ox.coordinates.aggregate([], ["elm"], "max") + 1;

	if(attr.row.elm_type.empty() && !this.inset.empty())
		attr.row.elm_type = this.inset.nom().elm_type;

	this.project.register_change();

	/**
	 * Удаляет элемент из контура и иерархии проекта
	 * Одновлеменно, удаляет строку из табчасти табчасти _Координаты_ и отключает наблюдателя
	 * @method remove
	 */
	this.remove = function () {

		if(this.parent && this.parent._noti && this.observer)
			Object.unobserve(this.parent._noti, this.observer);

		if(this.project.ox === attr.row._owner._owner)
			attr.row._owner.del(attr.row);
		delete attr.row;

		BuilderElement.superclass.remove.call(this);
		this.project.register_change();
	};

}

// BuilderElement наследует свойства класса Group
BuilderElement._extend(paper.Group);

// Привязываем свойства номенклатуры, вставки и цвета
BuilderElement.prototype.__define({

	/**
	 * ### Элемент - владелец
	 * имеет смысл для раскладок и рёбер заполнения
	 * @property owner
	 * @type BuilderElement
	 */
	owner: {
		get : function(){ return this.data.owner; },
		set : function(newValue){ this.data.owner = newValue; },
		enumerable : false
	},

	/**
	 * ### Образующая
	 * прочитать - установить путь образующей. здесь может быть линия, простая дуга или безье
	 * по ней будут пересчитаны pathData и прочие свойства
	 * @property generatrix
	 * @type paper.Path
	 */
	generatrix: {
		get : function(){ return this.data.generatrix; },
		set : function(attr){

			this.data.generatrix.removeSegments();

			if(this.hasOwnProperty('rays'))
				this.rays.clear();

			if(Array.isArray(attr))
				this.data.generatrix.addSegments(attr);

			else if(attr.proto &&  attr.p1 &&  attr.p2){

				// сначала, выясняем направление пути
				var tpath = attr.proto;
				if(tpath.getDirectedAngle(attr.ipoint) < 0)
					tpath.reverse();

				// далее, уточняем порядок p1, p2
				var d1 = tpath.getOffsetOf(attr.p1),
					d2 = tpath.getOffsetOf(attr.p2), d3;
				if(d1 > d2){
					d3 = d2;
					d2 = d1;
					d1 = d3;
				}
				if(d1 > 0){
					tpath = tpath.split(d1);
					d2 = tpath.getOffsetOf(attr.p2);
				}
				if(d2 < tpath.length)
					tpath.split(d2);

				this.data.generatrix.remove();
				this.data.generatrix = tpath;
				this.data.generatrix.parent = this;

				if(this.parent.parent)
					this.data.generatrix.guide = true;
			}
		},
		enumerable : true
	},

	/**
	 * путь элемента - состоит из кривых, соединяющих вершины элемента
	 * для профиля, вершин всегда 4, для заполнений может быть <> 4
	 * @property path
	 * @type paper.Path
	 */
	path: {
		get : function(){ return this.data.path; },
		set : function(attr){
			if(attr instanceof paper.Path){
				this.data.path.removeSegments();
				this.data.path.addSegments(attr.segments);
				if(!this.data.path.closed)
					this.data.path.closePath(true);
			}
		},
		enumerable : true
	},

	// виртуальные метаданные для автоформ
	_metadata: {
		get : function(){
			var t = this,
				_xfields = t.project.ox._metadata.tabular_sections.coordinates.fields, //_dgfields = this.project._dp._metadata.fields
				inset = _xfields.inset._clone();

			inset.choice_links = [{
				name: ["selection",	"ref"],
				path: [
					function(o, f){
						var selection = t instanceof Filling ?
						{elm_type: {in: [$p.enm.elm_types.Стекло, $p.enm.elm_types.Заполнение]}} :
						{elm_type: t.nom.elm_type};

						if($p.is_data_obj(o)){
							var ok = false;
							selection.nom = o;
							t.project._dp.sys.elmnts.find_rows(selection, function (row) {
								ok = true;
								return false;
							});
							return ok;
						}else{
							var refs = "";
							t.project._dp.sys.elmnts.find_rows(selection, function (row) {
								if(refs)
									refs += ", ";
								refs += "'" + row.nom.ref + "'";
							});
							return "_t_.ref in (" + refs + ")";
						}
				}]}
			];

			return {
				fields: {
					info: t.project.ox._metadata.fields.note,
					inset: inset,
					clr: _xfields.clr,
					x1: _xfields.x1,
					x2: _xfields.x2,
					y1: _xfields.y1,
					y2: _xfields.y2
				}
			};
		},
		enumerable : false
	},

	// виртуальный датаменеджер для автоформ
	_manager: {
		get: function () {
			return this.project._dp._manager;
		},
		enumerable : false
	},

	// номенклатура - свойство только для чтения, т.к. вычисляется во вставке
	nom:{
		get : function(){
			return this.inset.nom(this);
		},
		enumerable : false
	},

	// номер элемента - свойство только для чтения
	elm: {
		get : function(){
			return this._row.elm;
		},
		enumerable : false
	},

	// информация для редактора свойста
	info: {
		get : function(){
			return "№" + this.elm;
		},
		enumerable : true
	},

	// вставка
	inset: {
		get : function(){
			return (this._row ? this._row.inset : null) || $p.cat.inserts.get();
		},
		set : function(v){
			this._row.inset = v;
		},
		enumerable : false
	},

	// цвет элемента
	clr: {
		get : function(){
			return this._row.clr;
		},
		set : function(v){
			this._row.clr = v;
			var clr = this._row.clr,
				view_out = false,
				clr_str = clr.clr_str;

			if(!view_out){
				if(!clr.clr_in.empty() && clr.clr_in.clr_str)
					clr_str = clr.clr_in.clr_str;
			}else{
				if(!clr.clr_out.empty() && clr.clr_out.clr_str)
					clr_str = clr.clr_out.clr_str;
			}

			// цвет элементу присваиваем только если он уже нарисован
			if(clr_str && this.path instanceof paper.Path){
				clr = clr_str.split(",");
				if(clr.length == 1){
					if(clr_str[0] != "#")
						clr_str = "#" + clr_str;
					clr = new paper.Color(clr_str);
					clr.alpha = 0.96;

				}else if(clr.length == 4){
					clr = new paper.Color(clr[0], clr[1], clr[2], clr[3]);

				}else if(clr.length == 3){
					clr = new paper.Color({
						stops: [clr[0], clr[1], clr[2]],
						origin: this.path.bounds.bottomLeft,
						destination: this.path.bounds.topRight
					});
				}
				this.path.fillColor = clr;
			}

		},
		enumerable : false
	},

	// ширина
	width: {
		get : function(){
			return this.nom.width || 80;
		},
		enumerable : false
	},

	// толщина (для заполнений и, возможно, профилей в 3D)
	thickness: {
		get : function(){
			return this.inset.thickness;
		},
		enumerable : false
	},

	// опорный размер (0 для рам и створок, 1/2 ширины для импостов)
	sizeb: {
		get : function(){
			return this.inset.sizeb || 0;
		},
		enumerable : false
	},

	// размер до фурнитурного паза
	sizefurn: {
		get : function(){
			return this.nom.sizefurn || 20;
		},
		enumerable : false
	}

});


Editor.BuilderElement = BuilderElement;

