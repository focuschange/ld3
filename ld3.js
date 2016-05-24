/**
 * reference
 *  - http://bl.ocks.org/mbostock/4062045
 *  - http://bl.ocks.org/rpgove/f2abb9b4acaec88f099b
 *  - http://www.coppelia.io/2014/07/an-a-to-z-of-extra-features-for-the-d3-force-layout/
 */

var ld3 = new function() {
	var data = {};
	
	/**
	 * Force Directed Layout을 하나 생성함
	 */
	var fdl = {
		configUrl: "",
		dataUrl: "",
		viewClass: "",
		config: {},

		// force directed layout 관련 변수
		force: {},
		graphData: {},	// json으로 받은 그래프 정보
		graph: {},		// 시각화 처리를 위한 그래프 정보
		link: {},		// link 정보 
		node: {},		// node 정보
		
		/**
		 * 그래프 생성
		 * input
		 *  configUrl	환경설정 json 파일. 서버에서 읽어 온다
		 *  dataUrl		fdl에서 사용할 데이터 json 
		 *  viewClass	화면에 그려줄 위치를 지정한 svg class name. '.'을 앞에 항상 붙여야 함
		 */
		start: function(configUrl, dataUrl, viewClass) {
			
			this.configUrl = configUrl;
			this.dataUrl = dataUrl;
			this.viewClass = viewClass;
			
			d3.json(configUrl, function(error, data) {
				if (error) throw error;
				
				fdl.config = data;
				console.log(fdl.config);
				
				setController(fdl.config);
				setMarker(fdl.config);
				
				// data를 읽어 화면 출력
				run(fdl.config);
			});
			
			/*
			 * controller 모양 설정
			 */
			function setController(config)
			{
				var container = d3.select("body").select(".ld3-" + fdl.viewClass);
				container.append("div").attr("class", "controller");
				container.append("div").attr("class", "view");
				
				var controller = container.select(".controller");
				
				// threshold slider
				controller.append("table").append("tbody");
				var tbody = controller.select("tbody");
				
				tbody.append("tr").html('<th>link threshold</th>' + 
										'<td><input type="range" id="threshold-slider" name="threshold" value=0 min=0 max=100 oninput="ld3.fdl.threshold(this.value)"> 100</td>' +
										'<td><input type="text" id="threshold-text" name="points" disabled size="5" value="0"></td>'
				);
				tbody.append("tr").html('<th>link distance</th>' + 
										'<td><input type="range" id="distance-slider" name="distance" value=0 min=0 max=1000 oninput="ld3.fdl.distance(this.value)"> 1000</td>' +
										'<td><input type="text" id="distance-text" name="points" disabled size="5" value="0"></td>'
				);
				tbody.append("tr").html('<th>node scale</th>' + 
										'<td><input type="range" id="nodescale-slider" name="nodescale" value=0 min=0 max=100 oninput="ld3.fdl.nodeScale(this.value)"> 100</td>' +
										'<td><input type="text" id="nodescale-text" name="points" disabled size="5" value="0"></td>'
				);
				/*
				tbody.append("tr").html('<th>degree</th>' + 
										'<td><input type="range" id="degree-slider" name="degree" value=10 min=0 max=10 oninput="ld3.fdl.degree(this.value)"> 10</td>' +
										'<td><input type="text" id="degree-text" name="points" disabled size="5" value="10"></td>'
				);
				*/
				var view = container.select(".view");
				view.append("svg")
					.attr("class", fdl.viewClass);
			};
			
			/*
			 * 링크 모양 설정
			 */
			function setMarker(config)
			{
				fdl.force = d3.layout.force()
					.charge(config.charge)
					.linkDistance(config.distance)
					.size([ config.width, config.height ]);
				
				var grow = config.marker.grow;
				
				var color = d3.scale.category20();
				var svg = d3.select("body").select("." + fdl.viewClass).attr("width", config.width).attr("height", config.height);
				
				var defs = svg.append("defs");
				var circle = config.marker.circle;
				circle.varCircle = [{id:circle.id}];
				circle.circle = [];
				
				for(i = 0; i < config.marker.count; i ++)
				{
					var cid = new Object();
					cid.id = circle.id + (i + 1);
					
					circle.circle.push(cid);
				}
				
				// 가변크기 시작점
				var markerCircle = defs.selectAll(".marker").data(circle.varCircle).enter().append("marker")
					.attr("id", function(d) { return d.id;})
					.attr("markerWidth", function(d) { return circle.width;})
					.attr("markerHeight", function(d) { return circle.height;})
					.attr("refX", function(d) { return circle.refX;})
					.attr("refY", function(d) { return circle.refY;})
					.attr("markerUnits", "strokeWidth" )
				;
				
				markerCircle.append("circle")
					.attr("id", function(d) { return d.id;})
					.attr("cx", function(d) {return circle.cx;})
					.attr("cy", function(d) {return circle.cy;})
					.attr("r", function(d) { return circle.r;})
				;
				
				// 고정크기 시작점
				markerCircle = defs.selectAll(".marker").data(circle.circle).enter().append("marker")
					.attr("id", function(d) { return d.id;})
					.attr("markerWidth", function(d, i) { return circle.width + (i * 2);})
					.attr("markerHeight", function(d, i) { return circle.height + (i * 2);})
					.attr("refX", function(d, i) { return circle.refX + i;})
					.attr("refY", function(d, i) { return circle.refY + i;})
					.attr("markerUnits", "userSpaceOnUse" )
				;
				
				markerCircle.append("circle")
					.attr("id", function(d) { return d.id;})
					.attr("cx", function(d, i) {return circle.cx + (grow * i);})
					.attr("cy", function(d, i) {return circle.cy + (grow * i);})
					.attr("r", function(d, i) { return circle.r + (grow * i);})
				;
				
				var arrow = config.marker.arrow;
				arrow.varArrow = [{id:arrow.id}];
				arrow.arrow = [];
				
				for(i = 0; i < config.marker.count; i ++)
				{
					var aid = new Object();
					aid.id = arrow.id + (i + 1);
					
					arrow.arrow.push(aid);
				}
				
				// 가변크기 끝점 화살표 
				var markerArrow = defs.selectAll(".marker").data(arrow.varArrow).enter().append("marker")
					.attr("id", function(d) { return d.id;})
					.attr("markerWidth", function(d) { return arrow.width;})
					.attr("markerHeight", function(d) { return arrow.height;})
					.attr("refX", function(d) { return arrow.refX;})
					.attr("refY", function(d) { return arrow.refY;})
					.attr("orient", "auto")
					.attr("markerUnits", "strokeWidth" )
				;
				
				markerArrow.append("path")
					.attr("d", function(d) { 
						return "M" + arrow.path[0] + "," + arrow.path[1]
							+ " L" + arrow.path[2] + "," + arrow.path[3]
							+ " L" + arrow.path[4] + "," + arrow.path[5]
							+ " L" + arrow.path[0] + "," + arrow.path[1] ;
					})
				;
				
				// 고정크기 1~10
				markerArrow = defs.selectAll(".marker").data(arrow.arrow).enter().append("marker")
					.attr("id", function(d) { return d.id;})
					.attr("markerWidth", function(d, i) { return arrow.width + grow * i * 2;})
					.attr("markerHeight", function(d, i) { return arrow.height + grow * i * 2;})
					.attr("refX", function(d, i) { return arrow.refX;})
					.attr("refY", function(d, i) { return arrow.refY + (grow * i);})
					.attr("orient", "auto")
					.attr("markerUnits", "userSpaceOnUse" )
				;
				
				markerArrow.append("path")
					.attr("d", function(d, i) { 
						var growup = grow * i; 
						return "M" + arrow.path[0] + "," + arrow.path[1]
							+ " L" + arrow.path[2] + "," + (arrow.path[3] + growup * 2)
								+ " L" + (arrow.path[4] + growup) + "," + (arrow.path[5] + growup)
									+ " L" + arrow.path[0] + "," + arrow.path[1] ;
						})
					.style("fill", function(d) { return d.fill})
				;
			};
			
			function run(config)
			{
				var color = d3.scale.category20();
				var force = fdl.force;
				var svg = d3.select("body").select("." + viewClass);
				
				//Set up tooltip
				var tip = d3.tip()
					.attr('class', 'd3-tip')
					.offset([-10, 0])
					.html(function (d) {
						return  "<p>" + d.name + "</p>";
					});
				svg.call(tip);
				
				
				d3.json(dataUrl, function(error, data) {
					if (error) throw error;
					
					fdl.graphData = JSON.parse(JSON.stringify(data));
					fdl.graph = data;
					
					force
						.nodes(fdl.graph.nodes)
						.links(fdl.graph.links)
						.start();
					
					fdl.link = svg.selectAll(".link")
						.data(fdl.graph.links)
						.enter().append("path")
						.attr("class", "link")
					;	
					fdl.node = svg.selectAll(".node")
						.data(fdl.graph.nodes)
						.enter().append("g")
						.attr("class", "node")
						.call(force.drag)
						.on('mouseover', tip.show)
						.on('mouseout', tip.hide)
					;
					
					fdl.node.append("circle")
						.attr("class", "nodeCircle")
						.attr("r", function(d) {
							return d.nweight + 10;
						})
						.style("fill", function(d) {
							return color(d.group);
						})
						.call(force.drag)
						.on('mouseover', connectedNodes) //Added
						.on('mouseout', connectedNodes); //Added
					;
					
					fdl.node.append("text")
						.style("text-anchor", "middle")
						.style("font-size", function(d) { return (d.nweight/10 - 1) * 2 + 10;})
						.attr("dy", function(d) { var r = d.nweight + 10; return r / ((r * 25) / 100)})
						.style("stroke", "none")
						.style("fill", "#000000")
						.text(function(d) { return d.name; });
					
					force.on("tick", function() {
						fdl.link.attr("d", function(d) {
								var target = fdl.intersection(d.target.x, d.target.y,
									d.target.nweight + 10 + Math.sqrt(d.value), 
									d.source.x, d.source.y, 
									d.target.x, d.target.y);
								var source = fdl.intersection(d.source.x, d.source.y,
									d.source.nweight + 10 + Math.sqrt(d.value), 
									d.target.x, d.target.y,
									d.source.x, d.source.y); 
								//console.log(target);
								return "M" + source.x + "," + source.y + " L" + target.x + "," + target.y;
							})
							.style("stroke-width", function(d) {
								return Math.sqrt(d.value);
							})
							.style("fill", "none")
							.style("marker-end", function(d) { return "url(#markerArrow" + Math.round(Math.sqrt(d.value)) + ")"});
						;
						
						fdl.node.attr("transform", function(d) {
							return "translate(" + d.x + "," + d.y + ")"; 
						});
					});
					
					//Create an array logging what is connected to what
					var linkedByIndex = {};
					for (i = 0; i < fdl.graph.nodes.length; i++) {
						linkedByIndex[i + "," + i] = 1;
					};
					fdl.graph.links.forEach(function (d) {
						linkedByIndex[d.source.index + "," + d.target.index] = 1;
					});
					
					//Toggle stores whether the highlighting is on
					var toggle = 0;
					
					
					//This function looks up whether a pair are neighbours  
					function neighboring(a, b) {
						return linkedByIndex[a.index + "," + b.index];
					}
					
					function connectedNodes() {
						
						if (toggle == 0) {
							//Reduce the opacity of all but the neighbouring nodes
							d = d3.select(this).node().__data__;
							fdl.node.style("opacity", function (o) {
								return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
							});
							
							fdl.link.style("opacity", function (o) {
								return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
							});
							
							//Reduce the op
							
							toggle = 1;
						} else {
							//Put them back to opacity=1
							fdl.node.style("opacity", 1);
							fdl.link.style("opacity", 1);
							toggle = 0;
						}
						
					}
					
				});
			}
		},	
		
		intersection: function(cx, cy, r, x1, y1, x2, y2) {
			var rx;
			var ry;

			var m, n;

			// A,B1,C 원과 직선으로부터 얻어지는 2차방정식의 계수들
			// D: 판별식
			// X,Y: 교점의 좌표
			var A, B1, C, D;
			var X, Y;

			// A,B1,C,D게산
			if (x2 != x1) {
				// m, n계산
				m = (y2 - y1) / (x2 - x1);
				n = (y1 * x2 - x1 * y2) / (x2 - x1);

				A = m * m + 1;
				B1 = (m * n - m * cy - cx);
				C = (cx * cx + cy * cy - r * r + n * n - 2 * n * cy);
				D = B1 * B1 - A * C;

				if (D < 0)
					return 0;
				else if (D == 0) {
					X = -B1 / A;
					Y = m * X + n;
				} else {
					if (x1 < x2) {

						X = -(B1 + Math.sqrt(D)) / A;
						Y = m * X + n;
					}

					if (x1 > x2) {

						X = -(B1 - Math.sqrt(D)) / A;
						Y = m * X + n;
					}

				}
			} else {
				// a == c 인 경우는 수직선이므로
				// 근을 가지려면 a >= (x-r) && a <=(x+r) )
				// (a-x)*(a-x)
				// 1. 근이 없는 경우
				// a < (x-r) || a > (x+r)

				// 근이 없음
				if (x1 < (cx - r) || x1 > (cx + r))
					return 0;
				// 하나의 중근
				else if (x1 == (cx - r) || x1 == (cx + r)) {
					X = x1;
					Y = cy;
				}
				// 두개의 근
				else {
					if (x1 < x2) {

						// x = a를 대입하여 Y에 대하여 풀면
						X = x1;
						Y = cy + Math.sqrt(r * r - (x1 - cx) * (x1 - cx));
					}

					if (x1 > x2) {

						Y = cy - Math.sqrt(r * r - (x1 - cx) * (x1 - cx));
					}
				}
			}

			return ({
				x : X,
				y : Y,
				m : m,
				n : n
			});
		},

		threshold: function(thresh) {
			document.querySelector('#threshold-text').value = thresh;
			
			fdl.graph.links.splice(0, fdl.graph.links.length);

			for (var i = 0; i < fdl.graphData.links.length; i++) {
				if (fdl.graphData.links[i].value > thresh) {fdl.graph.links.push(fdl.graphData.links[i]);}
			};

			fdl.link = fdl.link.data(fdl.graph.links);
			fdl.link.exit().remove();
			fdl.link.enter().insert("path", ".node").attr("class", "link");
			fdl.force.start();
		},
		
		distance: function(distance)
		{
			document.querySelector('#distance-text').value = distance;
			
			fdl.force.linkDistance(fdl.config.distance + (distance*1)).start();
		},
		
		nodeScale: function(radius)
		{
			document.querySelector('#nodescale-text').value = radius;
			
			fdl.node.selectAll(".nodeCircle").
				attr("r", function(d) {
					return d.nweight + 10 + (+radius);
				});
			
			fdl.force.start();
		},
		
		/*
		 * 네트워크에서 중심이 되는 노드를 기준으로 차수를 제한하여 화면에 출력한다.
		 * 최대 10차수까지 표시한다
		 */
		degree: function(degree)
		{
			document.querySelector('#degree-text').value = degree;
			
			// TODO
			
		}

	}
	
	return {
		fdl : fdl
	}
	
};


