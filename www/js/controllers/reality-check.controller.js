angular
	.module('binary')
	.controller('RealityCheckController',
		function($scope, $rootScope, $state, $timeout, $location, websocketService, appStateService, accountService, $ionicPopup, alertService, $translate, languageService, proposalService, marketService) {
			var landingCompanyName;
			$scope.$on('authorize', function(e, authorize) {
				$scope.sessionLoginId = authorize.loginid;
				if (!appStateService.isRealityChecked && authorize.is_virtual == 0 && !appStateService.isChangedAccount) {
					landingCompanyName = authorize.landing_company_name;
					websocketService.sendRequestFor.landingCompanyDetails(landingCompanyName);
				} else if (appStateService.isRealityChecked && appStateService.isChangedAccount && authorize.is_virtual == 1) {
					$timeout.cancel($scope.realityCheckTimeout);
					appStateService.isChangedAccount = false;
					appStateService.isRealityChecked = true;
				} else if (appStateService.isRealityChecked && appStateService.isChangedAccount && authorize.is_virtual == 0) {
					if ($scope.realityCheckTimeout) {
						$timeout.cancel($scope.realityCheckTimeout);
					}
					appStateService.isRealityChecked = false;
					landingCompanyName = authorize.landing_company_name;
					websocketService.sendRequestFor.landingCompanyDetails(landingCompanyName);
					appStateService.isChangedAccount = false;
				}
				else if(!appStateService.isRealityChecked && authorize.is_virtual == 0 && appStateService.isChangedAccount){
					if ($scope.realityCheckTimeout) {
						$timeout.cancel($scope.realityCheckTimeout);
					}
					appStateService.isRealityChecked = false;
					landingCompanyName = authorize.landing_company_name;
					websocketService.sendRequestFor.landingCompanyDetails(landingCompanyName);
					appStateService.isChangedAccount = false;
				}
			});
			$scope.$on('landing_company_details', function(e, landingCompanyDetails) {
				if (landingCompanyDetails.has_reality_check === 1) {
					$scope.hasRealityCheck();
				}
			});

			$scope.setInterval = function setInterval(val) {
				var _interval;
				var set = sessionStorage.setItem('_interval', val);
			};
			$scope.setStart = function setInterval(val) {
				var start;
				var set = sessionStorage.setItem('start', val);
			};

			$scope.getInterval = function(key) {
				return sessionStorage.getItem(key);
			};
			$scope.getStart = function(key) {
				return sessionStorage.getItem(key);
			};

			$scope.removeInterval = function(key) {
				var remove = sessionStorage.removeItem(key);
			};
			$scope.removeStart = function(key) {
				var remove = sessionStorage.removeItem(key);
			};

			$scope.hasRealityCheck = function() {
				if (!appStateService.isRealityChecked && !sessionStorage.start) {

					$scope.realityCheck();
				} else if(!appStateService.isRealityChecked && sessionStorage.start) {
					appStateService.isRealityChecked = true;
						var timeGap = $scope.getStart('start');
						var now = (new Date()).getTime();
						if(($scope.getInterval('_interval') * 60000) - (now - timeGap) > 0){
							var period = ($scope.getInterval('_interval') * 60000) - (now - timeGap);
							console.log($scope.getInterval('_interval') * 60000);
							console.log(now - timeGap);
							console.log(period);
							$scope.realityCheckTimeout = $timeout($scope.getRealityCheck, period);
						}

					}

					else{
						var period = $scope.getInterval('_interval') * 60000;
						$scope.realityCheckTimeout = $timeout($scope.getRealityCheck, period);
					}
			}

			$scope.realityCheck = function() {
				appStateService.isRealityChecked = true;
				$scope.data = {};
				$scope.data.interval = 60;
				$translate(['realitycheck.continue', 'realitycheck.title'])
					.then(
						function(translation) {
							alertService.displayRealitCheckInterval(
								translation['realitycheck.title'],
								'realitycheck getinterval',
								$scope,
								'templates/components/reality-check/interval-popup.template.html', [{
									text: translation['realitycheck.continue'],
									onTap: function(e) {
										if ($scope.data.interval <= 120 && $scope.data.interval >= 1) {
											$scope.setInterval($scope.data.interval);
											$scope.data.start_interval = (new Date()).getTime();
											$scope.setStart($scope.data.start_interval);
											$scope.hasRealityCheck();
										} else {
											e.preventDefault();
										}
									}
								}, ]);
						}
					)

			};

			$scope.getLastInterval = function() {
				$scope.removeInterval('_interval');
				$scope.setInterval($scope.data.interval);
			};

			$scope.$on('reality_check', function(e, reality_check) {
				$scope.alertRealityCheck(reality_check);
			});


			$scope.getRealityCheck = function() {
				websocketService.sendRequestFor.realityCheck();
			}
			$scope.sessionTime = function(reality_check) {
				$scope.date = reality_check.start_time * 1000;
				$scope.start_time = new Date($scope.date);
				$scope.realityCheckitems.start_time = $scope.start_time.toUTCString();
				$scope.now = Date.now();
				$scope.realityCheckitems.currentTime = new Date($scope.now).toUTCString();
				$scope.duration = ($scope.now - $scope.date);
				$scope.realityCheckitems.days = Math.floor($scope.duration / 864e5);
				$scope.hour = $scope.duration - ($scope.realityCheckitems.days * 864e5);
				$scope.realityCheckitems.hours = Math.floor($scope.hour / 36e5);
				$scope.min = $scope.duration - (($scope.realityCheckitems.days * 864e5) + ($scope.realityCheckitems.hours * 36e5));
				$scope.realityCheckitems.minutes = Math.floor($scope.min / 60000);
			}

			$scope.logout = function() {
				alertService.confirmRemoveAllAccount(
					function(res) {
						if (typeof(res) !== "boolean") {
							if (res == 1)
								res = true;
							else
								res = false;
						}

						if (res) {
							accountService.removeAll();
							proposalService.remove();
							marketService.removeActiveSymbols();
							marketService.removeAssetIndex();
							appStateService.isLoggedin = false;
							websocketService.closeConnection();
							$scope.$parent.$broadcast('logout');
							$scope.removeInterval('_interval');
							appStateService.isRealityChecked = false;
							sessionStorage.removeItem('start');
							$state.go('signin');
						}
						if (!res) {
							$scope.hasRealityCheck();
						}
					}
				);
			};

			$scope.alertRealityCheck = function(reality_check) {
				$scope.removeStart('start');
				$scope.realityCheckitems = reality_check;
				if ($scope.sessionLoginId == $scope.realityCheckitems.loginid) {
					$scope.sessionTime(reality_check);
					$scope.data = {};
					$scope.data.interval = parseInt($scope.getInterval('_interval'));

					$translate(['realitycheck.title', 'realitycheck.continue', 'realitycheck.logout'])
						.then(
							function(translation) {
								alertService.displayRealityCheckResult(
									translation['realitycheck.title'],
									'realitycheck result-popup',
									$scope,
									'templates/components/reality-check/reality-check-result.template.html', [{
										text: translation['realitycheck.logout'],
										type: 'button-secondary',
										onTap: function() {
											$scope.logout();
										}
									}, {
										text: translation['realitycheck.continue'],
										onTap: function(e) {
											if ($scope.data.interval <= 120 && $scope.data.interval >= 1) {
												if($scope.sessionLoginId == $scope.realityCheckitems.loginid){
												$scope.data.interval = $scope.getLastInterval();
												$scope.data.start_interval = (new Date()).getTime();

												$scope.setStart($scope.data.start_interval);
												$scope.hasRealityCheck();
											}
											} else {
												e.preventDefault();
											}
										}
									}, ]
								);
							}
						)
				}

			};
		});